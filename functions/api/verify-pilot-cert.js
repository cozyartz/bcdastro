/**
 * Cloudflare Worker function to verify FAA Part 107 pilot certificates
 * Uses Cloudflare AI to validate certificate numbers against FAA database patterns
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { certificationNumber, userEmail } = await request.json();

    if (!certificationNumber || !userEmail) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: certificationNumber and userEmail'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use Cloudflare AI to validate the certificate format and check patterns
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are an FAA Part 107 certificate validator. Analyze the given certificate number and respond with a JSON object containing:
          - isValid: boolean indicating if the format matches FAA Part 107 patterns
          - confidence: number from 0-1 indicating confidence in validation
          - format: string describing the certificate format found
          - warnings: array of any potential issues found
          
          FAA Part 107 certificates typically follow patterns like:
          - 4-digit numbers (older certificates)
          - Alphanumeric combinations
          - May include hyphens or spaces
          
          Respond only with valid JSON.`
        },
        {
          role: 'user',
          content: `Validate this FAA Part 107 certificate number: ${certificationNumber}`
        }
      ]
    });

    let validationResult;
    try {
      validationResult = JSON.parse(aiResponse.response);
    } catch (parseError) {
      // Fallback validation using regex patterns
      validationResult = performFallbackValidation(certificationNumber);
    }

    // Store validation result in KV for caching and audit trail
    const validationRecord = {
      certificationNumber,
      userEmail,
      validationResult,
      timestamp: new Date().toISOString(),
      method: 'cloudflare-ai'
    };

    await env.KV_NAMESPACE.put(
      `cert-validation:${certificationNumber}`,
      JSON.stringify(validationRecord),
      { expirationTtl: 86400 } // 24 hours
    );

    // Log the validation attempt
    console.log(`Certificate validation for ${userEmail}: ${certificationNumber} - ${validationResult.isValid ? 'VALID' : 'INVALID'}`);

    return new Response(JSON.stringify({
      success: true,
      validation: validationResult,
      timestamp: validationRecord.timestamp
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Certificate validation error:', error);
    
    return new Response(JSON.stringify({
      error: 'Certificate validation failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Fallback validation using regex patterns when AI is unavailable
 */
function performFallbackValidation(certNumber) {
  const cleanCert = certNumber.replace(/[\s-]/g, '').toUpperCase();
  
  // Common FAA Part 107 certificate patterns
  const patterns = [
    /^\d{4}$/, // 4-digit numbers
    /^[A-Z0-9]{4,10}$/, // Alphanumeric 4-10 characters
    /^\d{4}[A-Z]{1,2}$/, // 4 digits followed by 1-2 letters
    /^[A-Z]{1,2}\d{4,6}$/, // 1-2 letters followed by 4-6 digits
  ];

  const matchedPattern = patterns.find(pattern => pattern.test(cleanCert));
  
  return {
    isValid: !!matchedPattern,
    confidence: matchedPattern ? 0.7 : 0.1,
    format: matchedPattern ? 'recognized-pattern' : 'unknown-format',
    warnings: matchedPattern ? [] : ['Certificate format not recognized'],
    method: 'regex-fallback'
  };
}