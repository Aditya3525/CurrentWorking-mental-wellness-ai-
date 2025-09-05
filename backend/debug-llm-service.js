/**
 * Direct LLM Service Debug Test
 */

// Load environment variables first
require('dotenv').config();

async function testLLMService() {
  console.log('🔍 Direct LLM Service Debug Test');
  console.log('=================================\n');
  
  try {
    console.log('1. Loading LLMService...');
    
    // Import the compiled JavaScript version
    const { LLMService } = require('./dist/services/llmProvider.js');
    
    console.log('2. Creating LLMService instance...');
    const llmService = new LLMService();
    
    console.log('3. Getting provider status...');
    const status = await llmService.getProviderStatus();
    
    console.log('4. Provider Status:');
    console.log(JSON.stringify(status, null, 2));
    
    console.log('\n5. Available providers:');
    Object.keys(status).forEach(provider => {
      console.log(`   - ${provider}: ${status[provider].available ? '✅ Available' : '❌ Not Available'}`);
    });
    
    if (status.gemini?.available) {
      console.log('\n6. Testing Gemini response...');
      const response = await llmService.generateResponse([
        { role: 'user', content: 'Hello, can you help me with anxiety?' }
      ]);
      
      console.log('7. Gemini Response:');
      console.log('   Provider:', response.provider);
      console.log('   Content:', response.content.substring(0, 100) + '...');
    } else {
      console.log('\n❌ Gemini not available, cannot test response generation');
    }
    
  } catch (error) {
    console.error('❌ Error in LLM Service test:', error);
    console.error('Stack trace:', error.stack);
  }
}

testLLMService();
