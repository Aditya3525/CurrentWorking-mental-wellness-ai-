const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Login to get token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test@123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    console.log('✅ Login successful');
    
    // Fetch assessment history
    const historyResponse = await fetch('http://localhost:5000/api/assessments/history', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const historyData = await historyResponse.json();
    
    console.log('\n📊 Assessment History Response:');
    console.log('Status:', historyResponse.status);
    console.log('\n🎯 Wellness Score:', JSON.stringify(historyData.data.insights?.wellnessScore, null, 2));
    console.log('\n📈 Summaries Count:', historyData.data.summaries?.length || 0);
    
    if (historyData.data.summaries) {
      console.log('\nSummaries:');
      historyData.data.summaries.forEach(s => {
        console.log(`  - ${s.assessmentType}: ${s.score}%`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
