#!/usr/bin/env node
/**
 * Quick test to verify the chat API returns real AI responses instead of placeholder
 */

const axios = require('axios');

async function testChatAPI() {
  console.log('🧪 Testing Chat API for Real AI Responses');
  console.log('==========================================\n');

  try {
    // Test message
    const testMessage = "I'm feeling anxious today, can you help me?";
    
    console.log(`📤 Sending message: "${testMessage}"`);
    
    const response = await axios.post('http://localhost:5000/api/chat/message', {
      message: testMessage
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('\n📥 Response received:');
    console.log('Status:', response.status);
    console.log('Provider:', response.data.provider || 'unknown');
    console.log('Response:', response.data.response || response.data.message);
    
    // Check if it's a placeholder response
    if (response.data.response && response.data.response.includes('Placeholder response')) {
      console.log('\n❌ FAILURE: Still getting placeholder response!');
      return false;
    } else {
      console.log('\n✅ SUCCESS: Real AI response detected!');
      console.log('🎯 Length:', response.data.response?.length || 0, 'characters');
      return true;
    }

  } catch (error) {
    console.error('\n❌ Error testing chat API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testChatAPI().then(success => {
  process.exit(success ? 0 : 1);
});