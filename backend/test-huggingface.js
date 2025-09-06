const { HuggingFaceProvider } = require('./dist/services/providers/HuggingFaceProvider');

async function testHuggingFace() {
  console.log('🤗 Testing HuggingFace Psychologist-3b Integration...\n');

  // Test with a sample API key (you'll need to get a real one)
  const provider = new HuggingFaceProvider({
    apiKeys: ['your_huggingface_api_key_here'],
    model: 'Guilherme34/Psychologist-3b',
    maxTokens: 256,
    temperature: 0.7,
    timeout: 30000
  });

  try {
    // Test connection
    console.log('Testing connection...');
    const isAvailable = await provider.isAvailable();
    console.log(`Provider available: ${isAvailable}`);

    if (!isAvailable) {
      console.log('❌ No API key configured. Please add your HuggingFace API key to test.');
      return;
    }

    // Test connection to the model
    console.log('Testing model connection...');
    const canConnect = await provider.testConnection();
    console.log(`Can connect to model: ${canConnect}`);

    // Test generating a response
    console.log('\nTesting response generation...');
    const messages = [
      {
        role: 'user',
        content: 'I\'ve been feeling anxious lately about work. Can you help me?'
      }
    ];

    const response = await provider.generateResponse(messages);
    
    console.log('\n✅ Response generated successfully!');
    console.log('Response:', response.content);
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Processing time:', response.processingTime + 'ms');
    
    if (response.usage) {
      console.log('Token usage:', response.usage);
    }

  } catch (error) {
    console.error('❌ Error testing HuggingFace provider:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 To test HuggingFace integration:');
      console.log('1. Get a free API key from https://huggingface.co/settings/tokens');
      console.log('2. Add it to your .env file as HUGGINGFACE_API_KEY=your_key_here');
      console.log('3. Run this test again');
    }
  }
}

// Run the test
testHuggingFace().catch(console.error);
