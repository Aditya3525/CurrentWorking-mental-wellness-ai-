const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000/api';
  const email = `chat.integration.${Date.now()}@example.com`;
  console.log('📧 Registering test user:', email);
  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Chat Integration Tester',
      email,
      password: 'Test123!pass'
    })
  });
  const registerJson = await registerRes.json();
  if (!registerRes.ok || !registerJson.success) {
    console.error('❌ Registration failed:', registerJson);
    process.exit(1);
  }

  const token = registerJson.data.token;
  console.log('✅ Registered. User ID:', registerJson.data.user.id);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 1) Send first message
  console.log('\n💬 Sending initial message...');
  let chatRes = await fetch(`${baseUrl}/chat/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: "I'm feeling anxious about upcoming deadlines and it's hurting my sleep."
    })
  });
  let chatJson = await chatRes.json();
  if (!chatRes.ok || !chatJson.success) {
    console.error('❌ Initial chat failed:', chatJson);
    process.exit(1);
  }

  console.log('🤖 Bot response:', chatJson.data.message?.content || chatJson.data.response);
  console.log('🆔 Conversation ID:', chatJson.data.conversationId);
  console.log('✨ Smart replies:', chatJson.data.smartReplies);

  const conversationId = chatJson.data.conversationId;

  // 2) Follow-up message referencing conversation
  console.log('\n💬 Sending follow-up asking for exercise...');
  chatRes = await fetch(`${baseUrl}/chat/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      conversationId,
      content: "Thanks. Could you suggest a short grounding exercise I can try before bed?"
    })
  });
  chatJson = await chatRes.json();
  if (!chatRes.ok || !chatJson.success) {
    console.error('❌ Follow-up chat failed:', chatJson);
    process.exit(1);
  }

  console.log('🤖 Bot response:', chatJson.data.message?.content || chatJson.data.response);
  if (chatJson.data.recommendations) {
    console.log('🧘 Exercise recommendations:', chatJson.data.recommendations.items?.map(item => item.title));
  }

  // 3) Fetch conversation list
  console.log('\n📜 Fetching conversation list...');
  const convListRes = await fetch(`${baseUrl}/conversations`, { headers });
  const convListJson = await convListRes.json();
  console.log('📦 Conversations:', convListJson.data?.map(conv => ({
    id: conv.id,
    title: conv.title,
    messageCount: conv.messageCount,
    lastMessageAt: conv.lastMessageAt
  })));

  // 4) Fetch conversation detail
  console.log('\n🔍 Fetching conversation detail...');
  const convDetailRes = await fetch(`${baseUrl}/conversations/${conversationId}`, { headers });
  const convDetailJson = await convDetailRes.json();
  console.log('📝 Conversation messages:', convDetailJson.data?.messages?.map(msg => ({
    type: msg.type,
    content: msg.content,
    createdAt: msg.createdAt
  })));

  // 5) Fetch conversation starters
  console.log('\n💡 Fetching conversation starters...');
  const startersRes = await fetch(`${baseUrl}/chat/starters`, { headers });
  const startersJson = await startersRes.json();
  console.log('⭐ Starters:', startersJson.data);

  // 6) Proactive check-in
  console.log('\n📬 Fetching proactive check-in...');
  const checkInRes = await fetch(`${baseUrl}/chat/check-in`, { headers });
  const checkInJson = await checkInRes.json();
  console.log('📮 Check-in data:', checkInJson.data);

  // 7) Provider health
  console.log('\n❤️ Checking AI provider health...');
  const healthRes = await fetch(`${baseUrl}/chat/ai/health`, { headers });
  const healthJson = await healthRes.json();
  console.log('🩺 Provider health:', healthJson.data);

  console.log('\n✅ Chatbot interaction test complete.');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
