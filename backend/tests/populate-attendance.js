const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, '../database.db');

let db;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function initializeDatabase() {
  return new Promise((resolve) => {
    db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        log(`✗ Database Error: ${err.message}`, 'red');
        process.exit(1);
      } else {
        log(`✓ Database Connected`, 'green');
        resolve();
      }
    });
  });
}

async function getTeacherCourses(teacherId) {
  return new Promise((resolve) => {
    db.all(
      `SELECT c.course_id, c.course_name FROM courses c WHERE c.teacher_id = ?`,
      [teacherId],
      (err, courses) => {
        if (err) {
          log(`✗ Error fetching courses: ${err.message}`, 'red');
          resolve([]);
        } else {
          resolve(courses || []);
        }
      }
    );
  });
}

async function getStudentsInCourse(courseId) {
  return new Promise((resolve) => {
    db.all(
      `SELECT s.student_id, s.name FROM students s 
       JOIN enrollments e ON s.student_id = e.student_id 
       WHERE e.course_id = ?`,
      [courseId],
      (err, students) => {
        if (err) {
          log(`✗ Error fetching students: ${err.message}`, 'red');
          resolve([]);
        } else {
          resolve(students || []);
        }
      }
    );
  });
}

async function insertAttendance(studentId, courseId, date, status) {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)`,
      [studentId, courseId, date, status],
      function(err) {
        if (err) {
          log(`  ✗ Error inserting attendance: ${err.message}`, 'red');
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
  });
}

async function generateBackdatedAttendance() {
  const teacherId = 2; // Teacher ID 2
  
  log(`\n=== Populating Backdated Attendance ===\n`, 'blue');
  log(`Fetching courses for Teacher ID: ${teacherId}`, 'yellow');

  const courses = await getTeacherCourses(teacherId);
  
  if (courses.length === 0) {
    log(`✗ No courses found for teacher ${teacherId}`, 'red');
    process.exit(1);
  }

  log(`✓ Found ${courses.length} course(s)`, 'green');

  let totalAttendanceRecords = 0;

  for (const course of courses) {
    log(`\n📚 Processing Course: ${course.course_name} (ID: ${course.course_id})`, 'bold');

    const students = await getStudentsInCourse(course.course_id);
    
    if (students.length === 0) {
      log(`  No students enrolled in this course`, 'yellow');
      continue;
    }

    log(`  Found ${students.length} student(s)`, 'green');

    // Generate attendance for last 30 days
    const today = new Date();
    const attendanceRecordsPerCourse = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // For each student, randomly mark as present or absent (80% present, 20% absent)
      for (const student of students) {
        const isPresent = Math.random() < 0.8; // 80% chance of being present
        const status = isPresent ? 'present' : 'absent';

        const success = await insertAttendance(student.student_id, course.course_id, dateStr, status);
        if (success) {
          attendanceRecordsPerCourse.push({
            studentName: student.name,
            date: dateStr,
            status: status
          });
          totalAttendanceRecords++;
        }
      }
    }

    log(`  ✓ Added ${attendanceRecordsPerCourse.length} attendance record(s) for this course`, 'green');
  }

  log(`\n=== Attendance Population Complete ===`, 'blue');
  log(`✓ Total Attendance Records Added: ${totalAttendanceRecords}`, 'green');
  log(`✓ Coverage: 30 days (excluding weekends) × Students per course`, 'green');
  
  process.exit(0);
}

// Run the script
initializeDatabase().then(() => {
  generateBackdatedAttendance().catch((err) => {
    log(`✗ Unexpected Error: ${err.message}`, 'red');
    process.exit(1);
  });
});
