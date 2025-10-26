const axios = require('axios');

async function testDebug() {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/practices');
    console.log('GET /api/admin/practices returned:', response.status);
    console.log('Number of practices:', response.data.data ? response.data.data.length : 'N/A');
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
  }
}

testDebug();
