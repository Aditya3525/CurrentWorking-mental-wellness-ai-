const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

const baseUrl = process.env.BASE_URL || 'http://localhost:5000/api';
const password = 'Test123!pass';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function registerUser() {
  const email = `rec.personalization.${Date.now()}@example.com`;
  console.log('📧 Registering user for recommendation test:', email);

  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Recommendation QA',
      email,
      password
    })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Registration failed: ${JSON.stringify(json)}`);
  }

  const token = json.data.token;
  const userId = json.data.user.id;
  console.log('✅ Registered user', userId);
  return { token, userId, email };
}

async function updateApproach(headers, approach) {
  console.log(`\n🧭 Updating preferred approach to ${approach}...`);
  const res = await fetch(`${baseUrl}/auth/approach/update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ password, approach })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Failed to update approach: ${JSON.stringify(json)}`);
  }
  console.log('✅ Approach updated.');
}

async function submitAssessment(headers) {
  console.log('\n📝 Submitting high-severity anxiety assessment to shape focus areas...');
  const now = new Date().toISOString();
  const res = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      assessmentType: 'anxiety_assessment',
      responses: {
        gad7_q1: 3,
        gad7_q2: 3,
        gad7_q3: 2,
        gad7_q4: 3,
        gad7_q5: 3,
        gad7_q6: 2,
        gad7_q7: 3
      },
      responseDetails: [
        {
          questionId: 'gad7_q1',
          questionText: 'Feeling nervous, anxious, or on edge',
          answerLabel: 'Nearly every day',
          answerValue: 3,
          answerScore: 3
        }
      ],
      score: 85,
      rawScore: 19,
      maxScore: 21
    })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Failed to submit assessment: ${JSON.stringify(json)}`);
  }
  console.log('✅ Assessment stored. Focus areas should now include anxiety.');
}

async function fetchRecommendations(headers, label, query = '') {
  console.log(`\n🔎 Fetching personalized recommendations (${label})...`);
  const url = query ? `${baseUrl}/recommendations/personalized?${query}` : `${baseUrl}/recommendations/personalized`;
  const res = await fetch(url, { headers });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Failed to fetch recommendations: ${JSON.stringify(json)}`);
  }

  const { data } = json;
  console.log('• Crisis level:', data.crisisLevel, '| Immediate action needed:', data.immediateAction);
  console.log('• Focus areas:', data.focusAreas.length ? data.focusAreas.join(', ') : 'none');
  console.log('• Rationale:', data.rationale);
  console.table(
    data.items.map((item) => ({
      title: item.title,
      type: item.type,
      approach: item.approach ?? 'n/a',
      source: item.source,
      reason: item.reason
    }))
  );

  return data;
}

async function listContent(headers) {
  const res = await fetch(`${baseUrl}/content`, { headers });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Failed to list content: ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function recordEngagement(headers, contentId) {
  console.log(`\n🧘 Recording engagement with content ${contentId} (completed, 5★ rating)...`);
  const res = await fetch(`${baseUrl}/content/${contentId}/engage`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      completed: true,
      rating: 5,
      effectiveness: 9,
      timeSpent: 600
    })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Failed to record engagement: ${JSON.stringify(json)}`);
  }
  console.log('✅ Engagement stored.');
}

async function main() {
  try {
    const { token } = await registerUser();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    await submitAssessment(headers);

    // Baseline with western approach
    await updateApproach(headers, 'western');
    const westernData = await fetchRecommendations(headers, 'Western preference', 'timeOfDay=evening&availableTime=20&environment=home');

    // Switch to eastern approach
    await updateApproach(headers, 'eastern');
    const easternData = await fetchRecommendations(headers, 'Eastern preference', 'timeOfDay=evening&availableTime=20&environment=home');

    // Highlight change in recommended practice approaches
    const westernApproaches = westernData.items.map((item) => item.approach).filter(Boolean);
    const easternApproaches = easternData.items.map((item) => item.approach).filter(Boolean);
    console.log('\n📊 Western approaches suggested:', westernApproaches);
    console.log('📊 Eastern approaches suggested:', easternApproaches);

    // Engage with an eastern content item to personalize further
    const catalogue = await listContent(headers);
    const mindfulVideo = catalogue.find((item) => item.title === 'Mindful Minute Video');
    if (mindfulVideo) {
      await recordEngagement(headers, mindfulVideo.id);
      // Give Prisma a brief moment to persist engagement stats before the next fetch
      await sleep(500);
      await fetchRecommendations(headers, 'After engaging with Mindful Minute Video', 'timeOfDay=evening&availableTime=20&environment=home');
    } else {
      console.warn('⚠️ Mindful Minute Video not found in catalogue; skipping engagement test.');
    }

    console.log('\n✅ Recommendation personalization test complete.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
