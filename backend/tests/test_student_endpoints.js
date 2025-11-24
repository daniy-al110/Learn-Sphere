const fetch = global.fetch || require('node-fetch');
const base = 'http://localhost:3000';
const creds = { email: 'daniyal@learnsphere.com', password: 'd' };

async function req(method, path, body) {
  const url = base + path;
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const text = await res.text();
    let parsed = text;
    try { parsed = JSON.parse(text); } catch (e) { /* keep text */ }
    return { ok: res.ok, status: res.status, url, body: parsed };
  } catch (err) {
    return { ok: false, status: 0, url, body: String(err) };
  }
}

(async () => {
  console.log('== Health check ==');
  console.log(await req('GET', '/api/health'));

  console.log('\n== Login as student ==');
  const loginRes = await req('POST', '/api/student/login', creds);
  console.log(loginRes);
  if (!loginRes.ok) {
    console.error('Login failed. Aborting further tests.');
    process.exit(1);
  }

  const student = loginRes.body.student;
  const studentId = (student && (student.student_id || student.studentId)) || loginRes.body.student_id || null;
  console.log('Detected studentId:', studentId);
  if (!studentId) {
    console.error('Could not determine student id from login response. Aborting.');
    process.exit(1);
  }

  const tests = [
    { name: 'Enrollments', path: `/api/student/enrollments/${studentId}` },
    { name: 'Attendance', path: `/api/student/attendance/${studentId}` },
    { name: 'Transcript', path: `/api/student/transcript/${studentId}` },
    { name: 'Quizzes', path: `/api/student/${studentId}/quizzes` },
    { name: 'Assignments', path: `/api/student/${studentId}/assignments` },
    { name: 'Certificate requests', path: `/api/student/${studentId}/certificate-requests` },
    { name: 'Test certificate file', path: `/certificates/certificate_1.svg` }
  ];

  for (const t of tests) {
    console.log(`\n== ${t.name} -> GET ${t.path} ==`);
    const r = await req('GET', t.path);
    console.log(r);
  }

  console.log('\nAll tests completed.');
})();
