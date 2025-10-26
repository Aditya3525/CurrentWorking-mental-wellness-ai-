// Quick Recommendation System Test
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function quickTest() {
  console.log('\n🔍 Quick Recommendation System Check\n');
  console.log('===================================\n');
  
  try {
    // 1. Register/Login
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: `quicktest-${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'Quick Tester'
    });
    
    const token = registerResponse.data.token || registerResponse.data.data?.token;
    const userId = registerResponse.data.user?.id || registerResponse.data.data?.user?.id;
    console.log(`✅ User registered: ${userId}\n`);
    
    // Skip assessments and mood for now - test recommendations directly
    console.log('2. Skipping optional steps (assessment, mood)...');
    console.log('   Testing recommendations with minimal user data\n');
    
    // 4. GET RECOMMENDATIONS (Main Test!)
    console.log('4. 🎯 Getting personalized recommendations...\n');
    const recResponse = await axios.get(`${BASE_URL}/recommendations/personalized`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        timeOfDay: 'afternoon',
        availableTime: 15,
        environment: 'work'
      }
    });
    
    const data = recResponse.data.data || recResponse.data;
    
    console.log('✅ RECOMMENDATIONS RECEIVED!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Display results
    console.log(`📊 RESULTS:`);
    console.log(`   Items Returned: ${data.items?.length || 0}`);
    console.log(`   Crisis Level: ${recResponse.data.meta?.crisisDetection?.level || data.crisisLevel || 'NONE'}`);
    console.log(`   Immediate Action: ${recResponse.data.meta?.crisisDetection?.immediateAction || data.immediateAction || false}`);
    console.log(`   Fallback Used: ${data.fallbackUsed || false}\n`);
    
    console.log(`🎯 Focus Areas Detected:`);
    if (data.focusAreas && data.focusAreas.length > 0) {
      data.focusAreas.forEach(area => console.log(`   • ${area}`));
    } else {
      console.log('   (none)');
    }
    
    console.log(`\n💡 Rationale:`);
    console.log(`   "${data.rationale || 'No rationale'}"\n`);
    
    console.log(`📚 Recommendations:\n`);
    
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title}`);
        console.log(`      Type: ${item.type} | Priority: ${item.priority || 'N/A'}`);
        console.log(`      Source: ${item.source} | Immediate: ${item.immediateRelief || false}`);
        console.log(`      Reason: "${item.reason}"`);
        if (item.duration) {
          console.log(`      Duration: ${Math.round(item.duration / 60)} min`);
        }
        console.log('');
      });
    } else {
      console.log('   ⚠️ No items returned\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Verification
    const checks = {
      itemsReturned: data.items && data.items.length > 0,
      hasFocusAreas: data.focusAreas && data.focusAreas.length > 0,
      hasCrisisDetection: !!recResponse.data.meta?.crisisDetection,
      hasRationale: !!data.rationale,
      itemsHaveReasons: data.items?.every(i => i.reason),
      itemsHavePriority: data.items?.every(i => i.priority),
      itemsHaveSource: data.items?.every(i => i.source)
    };
    
    console.log('✅ SYSTEM VERIFICATION:\n');
    Object.entries(checks).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      const label = check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${icon} ${label}`);
    });
    
    const allPassed = Object.values(checks).every(v => v);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (allPassed) {
      console.log('🎉 SUCCESS! Recommendation system is working END-TO-END!\n');
    } else {
      console.log('⚠️  PARTIAL SUCCESS - Some checks failed\n');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    console.error('\nStack:', error.stack);
    return false;
  }
}

// Run test
quickTest().then(success => {
  process.exit(success ? 0 : 1);
});
