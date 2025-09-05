/**
 * Direct Gemini Test - Bypassing the complex LLM service
 */

require('dotenv').config();

async function testGeminiDirect() {
  console.log('🔥 Testing Gemini Directly');
  console.log('========================\n');
  
  try {
    // Import Gemini provider directly
    const { GeminiProvider } = require('./dist/services/providers/GeminiProvider.js');
    
    // Create Gemini config
    const geminiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean);
    
    console.log(`Found ${geminiKeys.length} Gemini API keys`);
    
    const config = {
      apiKeys: geminiKeys,
      model: 'gemini-2.0-flash-exp',
      maxTokens: 150,
      temperature: 0.7,
      timeout: 30000
    };
    
    // Create provider
    const provider = new GeminiProvider(config);
    
    // Test availability
    console.log('Testing provider availability...');
    const isAvailable = await provider.isAvailable();
    console.log(`Gemini available: ${isAvailable ? '✅ YES' : '❌ NO'}`);
    
    if (isAvailable) {
      console.log('\n🤖 Testing response generation...');
      
      const messages = [
        { role: 'user', content: 'Hello! I need help with anxiety. Can you give me a brief supportive response?' }
      ];
      
      const startTime = Date.now();
      const response = await provider.generateResponse(messages);
      const duration = Date.now() - startTime;
      
      console.log(`\n✅ SUCCESS! Response generated in ${duration}ms`);
      console.log('Provider:', response.provider);
      console.log('Model:', response.model);
      console.log('Response:', response.content);
      console.log('Tokens used:', response.usage?.total_tokens || 'N/A');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGeminiDirect();
