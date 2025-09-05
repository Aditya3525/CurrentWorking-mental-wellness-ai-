/**
 * Frontend Chat Debug - Add this to browser console
 */

// Check if user is authenticated
console.log('🔍 Frontend Chat Debug');
console.log('======================');

// Check authentication token
const token = localStorage.getItem('token');
console.log('1. Auth token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

// Check user data
const userString = localStorage.getItem('user');
console.log('2. User data:', userString ? 'FOUND' : 'NOT FOUND');

if (userString) {
  try {
    const user = JSON.parse(userString);
    console.log('   User ID:', user.id);
    console.log('   User name:', user.name);
  } catch (e) {
    console.log('   Error parsing user data');
  }
}

// Test chat API manually
console.log('\n3. Testing chat API manually...');

if (token) {
  fetch('http://localhost:5000/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      content: 'Hello, this is a test message from browser console'
    })
  })
  .then(response => {
    console.log('Chat API status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Chat API response:', data);
  })
  .catch(error => {
    console.error('Chat API error:', error);
  });
} else {
  console.log('❌ No auth token found - user not logged in');
}

console.log('\n💡 Instructions:');
console.log('1. Copy and paste this entire code into your browser console');
console.log('2. Press Enter to run it');
console.log('3. Check the output to see if authentication is working');
