/**
 * Debug script to check Gemini API key configuration
 */

// Load environment variables
require('dotenv').config();

console.log('🔍 Debugging Gemini API Configuration');
console.log('=====================================\n');

console.log('Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GEMINI_API_KEY_1:', process.env.GEMINI_API_KEY_1 ? `${process.env.GEMINI_API_KEY_1.substring(0, 8)}...` : 'NOT SET');
console.log('GEMINI_API_KEY_2:', process.env.GEMINI_API_KEY_2 ? `${process.env.GEMINI_API_KEY_2.substring(0, 8)}...` : 'NOT SET');
console.log('GEMINI_API_KEY_3:', process.env.GEMINI_API_KEY_3 ? `${process.env.GEMINI_API_KEY_3.substring(0, 8)}...` : 'NOT SET');

// Test key filtering logic
const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean);

console.log('\nFiltered Keys (filter(Boolean)):');
geminiKeys.forEach((key, index) => {
  console.log(`Key ${index + 1}: ${key ? key.substring(0, 8) + '...' : 'undefined'}`);
});

// Test the actual filter logic from GeminiProvider
const validKeys = geminiKeys.filter(key => key && key.trim() !== '' && !key.includes('your_gemini'));

console.log('\nValid Keys (after provider filtering):');
console.log('Count:', validKeys.length);
validKeys.forEach((key, index) => {
  console.log(`Valid Key ${index + 1}: ${key.substring(0, 8)}...`);
});

// Test Gemini client initialization
console.log('\n🧪 Testing Gemini Client Initialization...');
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  if (validKeys.length > 0) {
    const testClient = new GoogleGenerativeAI(validKeys[0]);
    console.log('✅ Gemini client created successfully');
    
    // Test model access
    const model = testClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    console.log('✅ Gemini model instance created');
  } else {
    console.log('❌ No valid keys available for client creation');
  }
} catch (error) {
  console.log('❌ Error creating Gemini client:', error.message);
}

console.log('\n📋 Summary:');
console.log('- Total environment keys found:', geminiKeys.length);
console.log('- Valid keys after filtering:', validKeys.length);
console.log('- Expected behavior: Should have at least 1 valid key for Gemini to work');
