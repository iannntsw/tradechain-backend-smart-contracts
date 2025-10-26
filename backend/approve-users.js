// Script to approve existing users
// Use built-in fetch (Node.js 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');

// Load environment variables
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

// Admin credentials for authentication
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'password';

let adminToken = '';

async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const result = await response.json();

    if (response.ok) {
      adminToken = result.apiToken;
      console.log('✅ Successfully logged in as admin');
      console.log('');
      return true;
    } else {
      console.log('❌ Failed to login as admin');
      console.log(`   Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error logging in as admin');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function getPendingUsers() {
  try {
    console.log('📋 Fetching pending users...');
    
    const response = await fetch(`${API_BASE_URL}/admin/pending-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Found ${result.users.length} pending users`);
      return result.users;
    } else {
      console.log('❌ Failed to fetch pending users');
      console.log(`   Error: ${result.error}`);
      return [];
    }
  } catch (error) {
    console.log('❌ Error fetching pending users');
    console.log(`   Error: ${error.message}`);
    return [];
  }
}

async function approveUser(userId, userName) {
  try {
    console.log(`✅ Approving user: ${userName}`);
    
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Successfully approved user: ${userName}`);
      return true;
    } else {
      console.log(`❌ Failed to approve user: ${userName}`);
      console.log(`   Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error approving user: ${userName}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function approveAllPendingUsers() {
  console.log('🚀 Starting user approval script...');
  console.log('=====================================');
  console.log('');

  // Login as admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin authentication');
    process.exit(1);
  }

  // Get pending users
  const pendingUsers = await getPendingUsers();
  if (pendingUsers.length === 0) {
    console.log('✅ No pending users to approve');
    console.log('');
    console.log('=====================================');
    console.log('🏁 User approval script completed!');
    return;
  }

  console.log('');
  console.log('📝 Pending users found:');
  pendingUsers.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.userType}`);
  });
  console.log('');

  // Approve all pending users
  let approvedCount = 0;
  for (const user of pendingUsers) {
    const success = await approveUser(user._id, user.name);
    if (success) {
      approvedCount++;
    }
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log('=====================================');
  console.log(`🏁 User approval script completed!`);
  console.log(`✅ Approved ${approvedCount} out of ${pendingUsers.length} users`);
}

// Run the approval script
if (require.main === module) {
  approveAllPendingUsers().catch(console.error);
}

module.exports = { approveAllPendingUsers, approveUser, getPendingUsers };
