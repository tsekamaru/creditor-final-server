const bcrypt = require('bcrypt');
const saltRounds = 10;

const password = 'password123*';
// Saved hash for 'password123*':
// $2b$10$R5ATTaxDgQaWHG4smOPj4.R543BWmyeYQw2lvaofSHw6qb8ChyAWO

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('Password:', password);
    console.log('Hash:', hash);
  })
  .catch(err => console.error(err)); 