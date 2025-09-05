/**
 * Test chat API authentication
 */

async function testChatAuth() {
  console.log('🔐 Testing Chat API Authentication');
  console.log('==================================\n');
  
  const backendUrl = 'http://localhost:5000';
  
  try {
    // Test health endpoint (no auth required)
    console.log('1. Testing health endpoint...');
    let response = await fetch(`${backendUrl}/health`);
    console.log('Health status:', response.status);
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Backend health:', health.status);
    }
    
    // Test auth/me endpoint (should require auth)
    console.log('\n2. Testing auth/me endpoint...');
    response = await fetch(`${backendUrl}/api/auth/me`);
    console.log('Auth/me status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Auth endpoint correctly requires authentication');
    }
    
    // Test chat endpoint (should require auth)
    console.log('\n3. Testing chat endpoint without auth...');
    response = await fetch(`${backendUrl}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test message'
      })
    });
    
    console.log('Chat endpoint status:', response.status);
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Chat endpoint correctly requires authentication');
      console.log('Error:', result);
    } else {
      console.log('Response:', result);
    }
    
    console.log('\n📋 Analysis:');
    console.log('- The chat endpoint requires user authentication');
    console.log('- User needs to be logged in to send messages');
    console.log('- Frontend needs to have a valid JWT token');
    console.log('\n💡 Solution:');
    console.log('1. User must login/register first');
    console.log('2. JWT token must be stored in localStorage');
    console.log('3. Token must be included in chat API requests');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('Install node-fetch: npm install node-fetch');
  }
}

testChatAuth();
