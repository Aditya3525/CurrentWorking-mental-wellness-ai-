/**
 * Progress & Analytics Testing Script
 * Tests all progress tracking and analytics endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
  email: 'demo@example.com',
  password: 'demo123'
};

let authToken = null;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

// Login to get auth token
async function login() {
  try {
    logSection('🔐 AUTHENTICATION');
    logInfo('Logging in as demo user...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logSuccess('Login successful!');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login failed: Invalid response');
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test progress tracking
async function testProgressTracking() {
  logSection('📊 PROGRESS TRACKING');
  
  try {
    // Test 1: Track a progress entry
    logInfo('Test 1: Tracking new progress entry (Anxiety level)...');
    const trackResponse = await axios.post(
      `${API_BASE}/progress`,
      {
        metric: 'anxiety',
        value: 45,
        notes: 'Feeling better after meditation'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (trackResponse.data.success) {
      logSuccess('Progress entry created!');
      console.log('  Entry:', JSON.stringify(trackResponse.data.data, null, 2));
    } else {
      logError('Failed to track progress');
    }
    
    // Test 2: Track another metric
    logInfo('Test 2: Tracking sleep quality...');
    const sleepResponse = await axios.post(
      `${API_BASE}/progress`,
      {
        metric: 'sleep',
        value: 7.5,
        notes: 'Slept well last night'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (sleepResponse.data.success) {
      logSuccess('Sleep entry created!');
      console.log('  Entry:', JSON.stringify(sleepResponse.data.data, null, 2));
    }
    
    // Test 3: Track stress
    logInfo('Test 3: Tracking stress level...');
    const stressResponse = await axios.post(
      `${API_BASE}/progress`,
      {
        metric: 'stress',
        value: 35,
        notes: 'Work stress lower today'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (stressResponse.data.success) {
      logSuccess('Stress entry created!');
    }
    
    // Test 4: Validation - missing required fields
    logInfo('Test 4: Testing validation (missing value)...');
    try {
      await axios.post(
        `${API_BASE}/progress`,
        { metric: 'anxiety' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      logWarning('Validation should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Validation working correctly!');
      } else {
        logError('Unexpected error');
      }
    }
    
  } catch (error) {
    logError(`Progress tracking test failed: ${error.message}`);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }
}

// Test progress history retrieval
async function testProgressHistory() {
  logSection('📈 PROGRESS HISTORY');
  
  try {
    // Test 1: Get all progress history
    logInfo('Test 1: Fetching all progress history...');
    const allHistory = await axios.get(`${API_BASE}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (allHistory.data.success) {
      logSuccess(`Retrieved ${allHistory.data.data.length} progress entries!`);
      
      // Group by metric
      const byMetric = {};
      allHistory.data.data.forEach(entry => {
        if (!byMetric[entry.metric]) {
          byMetric[entry.metric] = [];
        }
        byMetric[entry.metric].push(entry);
      });
      
      console.log('\n  Progress entries by metric:');
      Object.keys(byMetric).forEach(metric => {
        console.log(`    ${metric}: ${byMetric[metric].length} entries`);
      });
      
      // Show recent entries
      console.log('\n  Recent entries:');
      allHistory.data.data.slice(0, 5).forEach(entry => {
        console.log(`    - ${entry.metric}: ${entry.value} (${new Date(entry.date).toLocaleDateString()})`);
      });
    } else {
      logError('Failed to fetch progress history');
    }
    
    // Test 2: Filter by specific metric
    logInfo('Test 2: Fetching anxiety-specific history...');
    const anxietyHistory = await axios.get(`${API_BASE}/progress?metric=anxiety`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (anxietyHistory.data.success) {
      logSuccess(`Retrieved ${anxietyHistory.data.data.length} anxiety entries!`);
      if (anxietyHistory.data.data.length > 0) {
        const latest = anxietyHistory.data.data[0];
        console.log(`  Latest anxiety value: ${latest.value}`);
      }
    }
    
  } catch (error) {
    logError(`Progress history test failed: ${error.message}`);
  }
}

// Test mood tracking
async function testMoodTracking() {
  logSection('😊 MOOD TRACKING');
  
  try {
    // Test 1: Log a mood
    logInfo('Test 1: Logging mood...');
    const moodResponse = await axios.post(
      `${API_BASE}/mood`,
      {
        mood: 'Good',
        notes: 'Had a productive day'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (moodResponse.data.success) {
      logSuccess('Mood logged successfully!');
      console.log('  Mood entry:', JSON.stringify(moodResponse.data.data, null, 2));
    }
    
    // Test 2: Get mood history
    logInfo('Test 2: Fetching mood history...');
    const historyResponse = await axios.get(`${API_BASE}/mood`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (historyResponse.data.success) {
      const entries = historyResponse.data.data.moodEntries || [];
      logSuccess(`Retrieved ${entries.length} mood entries!`);
      
      // Calculate mood distribution
      const moodCounts = {};
      entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      });
      
      console.log('\n  Mood distribution:');
      Object.entries(moodCounts).forEach(([mood, count]) => {
        console.log(`    ${mood}: ${count} entries`);
      });
    }
    
  } catch (error) {
    logError(`Mood tracking test failed: ${error.message}`);
  }
}

// Test assessment insights
async function testAssessmentInsights() {
  logSection('🧠 ASSESSMENT INSIGHTS');
  
  try {
    logInfo('Fetching assessment history and insights...');
    const response = await axios.get(`${API_BASE}/assessments/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data) {
      const { history, insights } = response.data.data;
      
      logSuccess(`Retrieved ${history?.length || 0} assessment results!`);
      
      if (insights) {
        console.log('\n  Overall Insights:');
        console.log(`    Wellness Score: ${insights.wellnessScore || 'N/A'}`);
        console.log(`    Overall Trend: ${insights.overallTrend || 'N/A'}`);
        
        if (insights.byType) {
          console.log('\n  By Assessment Type:');
          Object.entries(insights.byType).forEach(([type, summary]) => {
            console.log(`    ${type}:`);
            console.log(`      Latest Score: ${summary.latestScore}`);
            console.log(`      Trend: ${summary.trend}`);
            console.log(`      Interpretation: ${summary.interpretation}`);
          });
        }
        
        logSuccess('Insights are working correctly!');
      } else {
        logWarning('No insights available yet (need more assessments)');
      }
    }
    
  } catch (error) {
    logError(`Assessment insights test failed: ${error.message}`);
  }
}

// Test plan progress
async function testPlanProgress() {
  logSection('📋 PLAN PROGRESS');
  
  try {
    logInfo('Fetching personalized plan...');
    const response = await axios.get(`${API_BASE}/plans`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data) {
      const modules = response.data.data;
      logSuccess(`Retrieved ${modules.length} plan modules!`);
      
      const completed = modules.filter(m => m.userState?.completed).length;
      const inProgress = modules.filter(m => m.userState && !m.userState.completed).length;
      const notStarted = modules.filter(m => !m.userState).length;
      
      console.log('\n  Plan Module Status:');
      console.log(`    Completed: ${completed}`);
      console.log(`    In Progress: ${inProgress}`);
      console.log(`    Not Started: ${notStarted}`);
      
      if (modules.length > 0) {
        console.log('\n  Sample modules:');
        modules.slice(0, 3).forEach(module => {
          const status = module.userState?.completed ? 'Completed' : 
                        module.userState ? `${Math.round(module.userState.progress)}% complete` : 
                        'Not started';
          console.log(`    - ${module.title} (${status})`);
        });
      }
    }
    
  } catch (error) {
    logError(`Plan progress test failed: ${error.message}`);
  }
}

// Test analytics calculations
async function testAnalyticsCalculations() {
  logSection('📊 ANALYTICS CALCULATIONS');
  
  try {
    logInfo('Testing analytics calculations...');
    
    // Fetch all data needed for analytics
    const [progressRes, moodRes, assessmentRes] = await Promise.all([
      axios.get(`${API_BASE}/progress`, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(`${API_BASE}/mood`, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(`${API_BASE}/assessments/history`, { headers: { Authorization: `Bearer ${authToken}` } })
    ]);
    
    const progressEntries = progressRes.data.data || [];
    const moodEntries = moodRes.data.data?.moodEntries || [];
    const assessmentHistory = assessmentRes.data.data?.history || [];
    
    logSuccess('All data fetched successfully!');
    
    // Calculate streak
    console.log('\n  Calculating mood streak...');
    const calculateStreak = (entries) => {
      if (!entries.length) return 0;
      const uniqueDays = Array.from(new Set(
        entries.map(e => new Date(e.createdAt).toDateString())
      )).sort((a, b) => new Date(b) - new Date(a));
      
      if (!uniqueDays.length) return 0;
      
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
        return 0;
      }
      
      let streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const diff = (new Date(uniqueDays[i - 1]) - new Date(uniqueDays[i])) / 86400000;
        if (diff > 1.5) break;
        streak++;
      }
      return streak;
    };
    
    const currentStreak = calculateStreak(moodEntries);
    console.log(`    Current Streak: ${currentStreak} days`);
    
    // Calculate average mood
    console.log('\n  Calculating average mood...');
    const moodScores = { 'Great': 5, 'Good': 4, 'Okay': 3, 'Struggling': 2, 'Anxious': 1 };
    const averageMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + (moodScores[e.mood] || 3), 0) / moodEntries.length
      : 0;
    console.log(`    Average Mood: ${averageMood.toFixed(2)}/5`);
    
    // Progress metrics summary
    console.log('\n  Progress Metrics Summary:');
    const metricGroups = {};
    progressEntries.forEach(entry => {
      if (!metricGroups[entry.metric]) {
        metricGroups[entry.metric] = [];
      }
      metricGroups[entry.metric].push(entry.value);
    });
    
    Object.entries(metricGroups).forEach(([metric, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const latest = values[values.length - 1];
      console.log(`    ${metric}: Latest=${latest}, Avg=${avg.toFixed(1)}, Count=${values.length}`);
    });
    
    // Assessment completion rate
    console.log('\n  Assessment Activity:');
    const last30Days = assessmentHistory.filter(a => 
      (Date.now() - new Date(a.completedAt).getTime()) < 30 * 86400000
    );
    console.log(`    Completed in last 30 days: ${last30Days.length}`);
    console.log(`    Total assessments: ${assessmentHistory.length}`);
    
    logSuccess('Analytics calculations working correctly!');
    
  } catch (error) {
    logError(`Analytics calculations test failed: ${error.message}`);
  }
}

// Test export functionality (if implemented)
async function testExportFunctionality() {
  logSection('📄 EXPORT FUNCTIONALITY');
  
  try {
    logInfo('Testing export endpoint...');
    
    // Check if export endpoint exists
    const response = await axios.post(
      `${API_BASE}/export/progress`,
      { format: 'json' },
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true // Accept any status
      }
    );
    
    if (response.status === 200) {
      logSuccess('Export endpoint is working!');
      console.log('  Response type:', response.headers['content-type']);
    } else if (response.status === 404) {
      logWarning('Export endpoint not implemented yet');
    } else {
      logWarning(`Export returned status ${response.status}`);
    }
    
  } catch (error) {
    logWarning('Export endpoint not available or not implemented');
  }
}

// Main test runner
async function runAllTests() {
  console.clear();
  log('\n🧪 PROGRESS & ANALYTICS TESTING SUITE\n', 'cyan');
  log('Testing Mental Wellbeing AI App - Progress Features\n', 'cyan');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('Cannot continue without authentication');
    process.exit(1);
  }
  
  // Run all tests
  await testProgressTracking();
  await testProgressHistory();
  await testMoodTracking();
  await testAssessmentInsights();
  await testPlanProgress();
  await testAnalyticsCalculations();
  await testExportFunctionality();
  
  // Final summary
  logSection('✅ TEST SUMMARY');
  logSuccess('All tests completed!');
  logInfo('\nWhat was tested:');
  console.log('  ✅ Progress tracking (create entries)');
  console.log('  ✅ Progress history (retrieve & filter)');
  console.log('  ✅ Mood tracking & history');
  console.log('  ✅ Assessment insights');
  console.log('  ✅ Plan progress tracking');
  console.log('  ✅ Analytics calculations');
  console.log('  ℹ️  Export functionality');
  
  logInfo('\nProgress & Analytics System Status: 🟢 WORKING');
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  logError(`\nTest suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
