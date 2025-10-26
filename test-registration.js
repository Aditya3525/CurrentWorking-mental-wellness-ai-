// Quick test script to verify registration endpoint
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('\n🧪 Testing Registration Endpoint...\n');

  // Test 1: Valid Registration
  console.log('Test 1: Valid Registration');
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✅ PASS: Registration successful');
      console.log('   User ID:', data.data?.user?.id);
      console.log('   Token received:', data.data?.token ? 'Yes' : 'No');
    } else {
      console.log('❌ FAIL:', data.error || 'Unknown error');
      if (data.errors) {
        console.log('   Validation errors:', data.errors);
      }
    }
  } catch (error) {
    console.log('❌ FAIL: Network error', error.message);
  }

  // Test 2: Missing Name Field
  console.log('\nTest 2: Missing Name Field (Should Fail)');
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    const data = await response.json();
    if (!response.ok && data.errors?.name) {
      console.log('✅ PASS: Validation caught missing name');
      console.log('   Error:', data.errors.name);
    } else {
      console.log('❌ FAIL: Should have rejected missing name');
    }
  } catch (error) {
    console.log('❌ FAIL: Network error', error.message);
  }

  // Test 3: Short Password
  console.log('\nTest 3: Short Password (Should Fail)');
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: '123'
      })
    });
    const data = await response.json();
    if (!response.ok && data.errors?.password) {
      console.log('✅ PASS: Validation caught short password');
      console.log('   Error:', data.errors.password);
    } else {
      console.log('❌ FAIL: Should have rejected short password');
    }
  } catch (error) {
    console.log('❌ FAIL: Network error', error.message);
  }

  // Test 4: Invalid Email
  console.log('\nTest 4: Invalid Email (Should Fail)');
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123'
      })
    });
    const data = await response.json();
    if (!response.ok && data.errors?.email) {
      console.log('✅ PASS: Validation caught invalid email');
      console.log('   Error:', data.errors.email);
    } else {
      console.log('❌ FAIL: Should have rejected invalid email');
    }
  } catch (error) {
    console.log('❌ FAIL: Network error', error.message);
  }

  console.log('\n✅ All tests completed!\n');
}

testRegistration();
