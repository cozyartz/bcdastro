// Simple script to create admin user via signup API
import fetch from 'node-fetch';

async function createAdminUser() {
  const email = 'cozy2963@gmail.com';
  const password = 'TempAdmin123!'; // Change this after first login
  
  try {
    console.log('Creating admin user via signup API...');
    
    const response = await fetch('http://localhost:4321/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName: 'Cozy',
        isAdmin: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Signup failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Temp Password:', password);
    console.log('Token:', result.token);
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
    console.log('\n📝 Manual Steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Go to /dashboard');
    console.log('3. Click "Create Account"');
    console.log('4. Use email: cozy2963@gmail.com');
    console.log('5. Set a strong password');
    console.log('6. After signup, manually update the users table to set is_admin = true');
  }
}

createAdminUser();