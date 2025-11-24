const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  
  console.log('\n====== SCHEDULE VERIFICATION REPORT ======\n');
  
  // Check courses with schedule
  db.all(`SELECT course_id, course_name, schedule, duration FROM courses ORDER BY course_id`, (err, courses) => {
    if (err) {
      console.error('Error querying courses:', err.message);
      db.close();
      return;
    }
    
    console.log('📋 COURSES IN DATABASE:');
    console.table(courses);
    
    // Count how many have schedules
    const withSchedule = courses.filter(c => c.schedule).length;
    console.log(`\n✓ Courses WITH schedule: ${withSchedule}/${courses.length}`);
    
    // Check student enrollments
    db.all(`
      SELECT e.student_id, e.course_id, c.course_name, c.schedule, c.duration 
      FROM enrollments e 
      JOIN courses c ON e.course_id = c.course_id 
      ORDER BY e.student_id, e.course_id
    `, (err, enrollments) => {
      if (err) {
        console.error('Error querying enrollments:', err.message);
        db.close();
        return;
      }
      
      console.log('\n📚 STUDENT ENROLLMENTS WITH SCHEDULE:');
      if (enrollments.length === 0) {
        console.log('  (no enrollments)');
      } else {
        console.table(enrollments);
      }
      
      // Summary
      const enrollmentsWith = enrollments.filter(e => e.schedule).length;
      console.log(`\n✓ Enrollments WITH visible schedule: ${enrollmentsWith}/${enrollments.length}`);
      
      console.log('\n====== END REPORT ======\n');
      db.close();
    });
  });
});
