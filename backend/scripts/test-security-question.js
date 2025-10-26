const fetch = global.fetch;

async function main() {
  const base = 'http://localhost:5000/api';
  const email = `test${Date.now()}@example.com`;

  const registerRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password: 'password123' }),
  });
  const registerData = await registerRes.json();
  console.log('register status', registerRes.status, registerData);
  if (!registerRes.ok) {
    throw new Error('Registration failed');
  }

  const token = registerData.data.token;

  const secRes = await fetch(`${base}/auth/security-question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question: 'Test question', answer: 'Test answer' }),
  });
  const secData = await secRes.json();
  console.log('security status', secRes.status, secData);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
