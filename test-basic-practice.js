const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testBasicPractice() {
  console.log('Testing basic practice creation without V2 fields...\n');
  
  try {
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const sessionCookie = loginResponse.headers['set-cookie'];
    console.log('✅ Admin logged in');
    
    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        Cookie: sessionCookie ? sessionCookie.join('; ') : ''
      }
    };
    
    // Create basic practice
    const practiceData = {
      title: 'Test Basic Breathing',
      type: 'breathing',
      duration: 5,
      difficulty: 'beginner',
      approach: 'western',
      format: 'Audio',
      description: 'A simple breathing exercise',
      audioUrl: 'https://example.com/audio/test.mp3',
      thumbnailUrl: 'https://example.com/thumb/test.jpg',
      tags: 'breathing,test',
      isPublished: true
    };
    
    console.log('Sending practice data...');
    const response = await axios.post(
      `${BASE_URL}/api/admin/practices`,
      practiceData,
      config
    );
    
    console.log('✅ Practice created!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testBasicPractice();
