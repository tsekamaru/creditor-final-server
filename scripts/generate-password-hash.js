/**
 * Password Hash Generator
 * 
 * This script generates a bcrypt hash from a plaintext password.
 * Usage: node generate-password-hash.js <password>
 * 
 * Example: node generate-password-hash.js mySecurePassword123
 */

const bcrypt = require('bcrypt');

// Configuration
const saltRounds = 10;

async function generateHash() {
  // Get password from command line arguments
  const password = process.argv[2];
  
  if (!password) {
    console.error('Error: Please provide a password as an argument.');
    console.log('Usage: node generate-password-hash.js <password>');
    process.exit(1);
  }

  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('\n--- Password Hash Generator ---');
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('\n✅ You can now update the password_hash field in your database with this hash.');
    console.log('📝 SQL Example:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'user@example.com';`);
    
  } catch (error) {
    console.error('Error generating hash:', error.message);
  }
}

// Run the function
generateHash(); 