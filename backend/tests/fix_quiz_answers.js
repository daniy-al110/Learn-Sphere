const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbFile);

function safeParse(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  try { return JSON.parse(v); } catch (e) { return String(v); }
}

db.serialize(() => {
  db.all('SELECT question_id, options, correct_answer FROM quiz_questions', [], (err, rows) => {
    if (err) return console.error('Failed to read quiz_questions:', err);
    let updates = 0;
    rows.forEach(r => {
      let opts = [];
      try { opts = JSON.parse(r.options || '[]'); } catch (e) { opts = [] }
      const caRaw = r.correct_answer;
      const caParsed = safeParse(caRaw);
      let idx = null;
      if (typeof caParsed === 'number' && Number.isFinite(caParsed) && caParsed >= 0 && caParsed < opts.length) {
        idx = caParsed;
      } else if (typeof caParsed === 'string' && /^[a-zA-Z]$/.test(caParsed)) {
        idx = caParsed.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
      } else if (typeof caParsed === 'string') {
        // try match by exact option text
        const match = opts.findIndex(o => String(o).trim().toLowerCase() === caParsed.trim().toLowerCase());
        if (match !== -1) idx = match;
        else {
          // try to find a digit inside the raw string that matches an option exactly
          const digits = String(caRaw).match(/\d+/g) || [];
          for (const d of digits) {
            const m = opts.findIndex(o => String(o).trim() === d.trim());
            if (m !== -1) { idx = m; break; }
          }
        }
      }

      if (idx === null || idx === undefined || idx < 0 || idx >= opts.length) {
        // fallback to 0 if no reasonable match
        idx = 0;
      }

      const newVal = String(idx);
      if (String(r.correct_answer) !== newVal) {
        db.run('UPDATE quiz_questions SET correct_answer = ? WHERE question_id = ?', [newVal, r.question_id], function (uErr) {
          if (uErr) return console.error('Failed to update question', r.question_id, uErr.message);
          updates++;
          console.log(`Updated question ${r.question_id}: ${r.correct_answer} -> ${newVal}`);
        });
      }
    });

    setTimeout(() => {
      console.log('Done. Total updates:', updates);
      db.close();
    }, 500);
  });
});
