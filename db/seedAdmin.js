const { execSync } = require('child_process');

// Fetch JWT_SECRET from environment (set locally or via wrangler)
const jwtSecret = process.env.JWT_SECRET || 'default_secret'; // Use local .env or Wrangler secret

// Insert admin user
const insertCommand = `
  wrangler d1 execute bcdastro-db --command \\
  "INSERT INTO users (id, email, password_hash, is_admin, part_107_certified) \\
  VALUES ('admin1', 'cozy2963@gmail.com', '${jwtSecret}', true, true)"
`;

try {
  execSync(insertCommand, { stdio: 'inherit' });
  console.log('Admin user seeded successfully');
} catch (error) {
  console.error('Error seeding admin user:', error.message);
}