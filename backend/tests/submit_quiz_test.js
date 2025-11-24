const fetch = global.fetch || require('node-fetch');
const base = 'http://localhost:3000';
const studentId = 1;

async function req(method, path, body) {
  const url = base + path;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const txt = await res.text();
  let parsed = txt;
  try { parsed = JSON.parse(txt); } catch (e) {}
  return { ok: res.ok, status: res.status, url, body: parsed };
}

(async () => {
  console.log('Fetching quizzes for student', studentId);
  const qres = await req('GET', `/api/student/${studentId}/quizzes`);
  console.log('Quizzes response:', qres.status);
  if (!qres.ok) return console.error('Failed to fetch quizzes', qres.body);
  const quizzes = qres.body.quizzes || [];
  const quiz = quizzes.find(q => q.is_active && !q.submitted_at) || quizzes[0];
  if (!quiz) return console.error('No quizzes available to submit');
  console.log('Using quiz:', quiz.quiz_id || quiz.quizId);
  const quizId = quiz.quiz_id || quiz.quizId;

  // Use debug endpoint to read correct answers
  const debug = await req('GET', `/api/debug/quiz/${quizId}`);
  if (!debug.ok) return console.error('Failed to fetch quiz debug', debug.body);
  const questions = debug.body.questions || [];
  const answers = {};
  questions.forEach(q => {
    // q.correct_answer may be a string containing the index
    let ca = q.correct_answer;
    // try parse number
    let idx = null;
    const num = Number(ca);
    if (!isNaN(num)) idx = num;
    else if (typeof ca === 'string' && ca.length === 1) idx = ca.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
    else {
      // try match by option text
      try {
        const opts = JSON.parse(q.options || '[]');
        const found = opts.findIndex(o => String(o).trim().toLowerCase() === String(ca).trim().toLowerCase());
        if (found !== -1) idx = found;
      } catch (e) {}
    }
    answers[q.question_id] = idx != null ? idx : 0;
  });

  console.log('Submitting answers:', answers);
  const submit = await req('POST', `/api/student/quiz/${quizId}/submit`, { studentId, answers });
  console.log('Submit response:', submit.status, submit.body);
})();
