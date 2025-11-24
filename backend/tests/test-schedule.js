const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('Database opened');

  // Check courses with schedule
  db.all(`SELECT course_id, course_name, schedule, duration FROM courses LIMIT 10`, (err, rows) => {
    if (err) {
      console.error('Error querying courses:', err.message);
    } else {
      console.log('\n=== COURSES WITH SCHEDULE ===');
      console.table(rows);
    }

    // Check enrollments
    db.all(`SELECT e.enrollment_id, e.student_id, e.course_id, c.course_name, c.schedule, c.duration FROM enrollments e JOIN courses c ON e.course_id = c.course_id LIMIT 10`, (err, rows) => {
      if (err) {
        console.error('Error querying enrollments:', err.message);
      } else {
        console.log('\n=== ENROLLMENTS WITH SCHEDULE ===');
        console.table(rows);
      }
      db.close();
    });
  });
});
