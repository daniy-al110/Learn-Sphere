const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

const tables = ['attendance', 'quizzes', 'assignments', 'instructor_performance'];

tables.forEach(table => {
  db.all(`PRAGMA table_info(${table})`, (err, rows) => {
    console.log(`\n${table.toUpperCase()}:`);
    if (rows) {
      rows.forEach(row => console.log(`  - ${row.name} (${row.type})`));
    }
  });
});

setTimeout(() => db.close(), 1000);
