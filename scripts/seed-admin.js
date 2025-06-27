import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://ttopqchrjodfaunrrqoz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b3BxY2hyam9kZmF1bnJycW96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg3MDc3NiwiZXhwIjoyMDY2NDQ2Nzc2fQ.kO6pMpg4Giyre655YxVtxWHUTS8TYcc5MNlO0r_1Kpk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdminUser() {
  const email = 'cozy2963@gmail.com';
  const password = 'TempAdmin123!'; // Change this after first login
  const fullName = 'Cozy';
  
  try {
    console.log('Creating admin user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
      },
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created:', authData.user.id);

    // Create user profile in users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        is_admin: true,
        is_verified: true,
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        subscription_start: new Date().toISOString(),
        commission_rate: 0, // Admin pays no commission
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Temp Password:', password);
    console.log('User ID:', authData.user.id);
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

seedAdminUser();