'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

const USERS = [
  ['superadmin', 'superadmin', 'Super Administrator',  'admin@aitrcvita.edu.in',     '9000000001'],
  ['transport',  'transport',  'Transport Manager',    'transport@aitrcvita.edu.in', '9000000002'],
  ['finance',    'finance',    'Finance Officer',      'finance@aitrcvita.edu.in',   '9000000003'],
  ['security1',  'security',   'Security Staff',       'security@aitrcvita.edu.in',  '9000000004'],
  ['principal',  'principal',  'Principal',            'principal@aitrcvita.edu.in', '9000000005'],
  ['accountant', 'accountant', 'Accountant',           'accounts@aitrcvita.edu.in',  '9000000006'],
  ['driver01',   'driver',     'Ramchandra Patil',     'driver1@aitrcvita.edu.in',   '9823401201'],
  ['student01',  'student',    'Demo Student',         'student@aitrcvita.edu.in',   '9876543210'],
];

async function setup() {
  console.log('\n🚌 AITRC Transport ERP v4.0 — First-Time Setup\n');
  try {
    const hash = await bcrypt.hash('admin@1234', 10);
    for (const [username, role, full_name, email, phone] of USERS) {
      await query(
        `INSERT INTO users (username,password_hash,role,full_name,email,phone)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
        [username, hash, role, full_name, email, phone]
      );
      console.log(`  ✓ ${username.padEnd(12)} (${role})`);
    }
    const [[{ routes }]] = await query('SELECT COUNT(*) as routes FROM routes');
    const [[{ stops }]]  = await query('SELECT COUNT(*) as stops FROM stops');
    const [[{ users }]]  = await query('SELECT COUNT(*) as users FROM users');
    console.log(`\n✅ Setup complete!`);
    console.log(`   Users: ${users} | Routes: ${routes} | Stops: ${stops}`);
    console.log('\n🔑 Login Credentials (all passwords: admin@1234)');
    console.log('   superadmin → Super Admin (ALL tabs)');
    console.log('   transport  → Transport Manager');
    console.log('   finance    → Finance Officer');
    console.log('   security1  → Security Gate only');
    console.log('   principal  → Principal Dashboard\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.error('   Make sure MySQL is running and database schema is imported first.');
    process.exit(1);
  }
}

setup();
