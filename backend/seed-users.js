// Use built-in fetch (Node.js 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');

// Load environment variables
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

const users = [
  {
    name: "Ian",
    email: "sales@gmail.com",
    password: "password",
    organisationId: "sales-business",
    documentStoreAdmin: process.env.WALLET_ADDR_3,
    userType: "sales"
  },
  {
    name: "Donovan",
    email: "purchase@gmail.com",
    password: "password",
    organisationId: "purchase-business",
    documentStoreAdmin: process.env.WALLET_ADDR_4,
    userType: "purchase"
  },
  {
    name: "Dylan",
    email: "invoice@gmail.com",
    password: "password",
    organisationId: "invoice-business",
    documentStoreAdmin: process.env.WALLET_ADDR_5,
    userType: "invoice"
  }
];

async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.name} (${userData.email})`);
    
    const response = await fetch(`${API_BASE_URL}/user/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Successfully created user: ${userData.name}`);
      console.log(`   User ID: ${result.user._id}`);
      console.log(`   Document Store: ${result.user.documentStoreAddress}`);
      console.log('');
    } else {
      console.log(`❌ Failed to create user: ${userData.name}`);
      console.log(`   Error: ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      console.log('');
    }
  } catch (error) {
    console.log(`❌ Error creating user: ${userData.name}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
  }
}

async function seedUsers() {
  console.log('🌱 Starting user seed script...');
  console.log('=====================================');
  console.log('');

  // Check if environment variables are set
  const requiredEnvVars = ['WALLET_ADDR_3', 'WALLET_ADDR_4', 'WALLET_ADDR_5'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('');
    console.log('Please set these environment variables in your .env file');
    process.exit(1);
  }

  console.log('Environment variables found:');
  console.log(`   WALLET_ADDR_3: ${process.env.WALLET_ADDR_3}`);
  console.log(`   WALLET_ADDR_4: ${process.env.WALLET_ADDR_4}`);
  console.log(`   WALLET_ADDR_5: ${process.env.WALLET_ADDR_5}`);
  console.log('');

  // Create users sequentially
  for (const user of users) {
    await createUser(user);
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('=====================================');
  console.log('🏁 User seed script completed!');
}

// Run the seed script
if (require.main === module) {
  seedUsers().catch(console.error);
}

module.exports = { seedUsers, createUser };
