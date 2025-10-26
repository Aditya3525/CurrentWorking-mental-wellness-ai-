const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  console.log('Testing Gemini API...\n');
  
  const apiKey = process.env.GEMINI_API_KEY_1;
  console.log('API Key found:', apiKey ? 'YES' : 'NO');
  
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY_1 not found');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Test with mental health prompt
  console.log('\nTesting with mental health conversation...');
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });
    
    const prompt = "I'm feeling really anxious today. Can you help me?";
    console.log('Prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log('\nPrompt Feedback:', response.promptFeedback);
    console.log('Block Reason:', response.promptFeedback?.blockReason || 'None');
    console.log('\nResponse:', response.text());
    console.log('\nSUCCESS ✓');
  } catch (error) {
    console.error('\nFAILED ✗');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

testGemini().catch(console.error);
