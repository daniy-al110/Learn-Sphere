// Test schedule save
const fetch = require('node-fetch');

async function testSaveSchedule() {
  try {
    console.log('Testing schedule save...');
    
    const response = await fetch('http://localhost:3000/api/courses/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedule: 'Mon-Wed 10:00-11:30',
        duration: '1.5 hours'
      })
    });
    
    console.log('Response status:', response.status);
    const json = await response.json();
    console.log('Response:', json);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSaveSchedule();
