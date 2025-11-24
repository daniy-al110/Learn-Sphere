const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '../database.db');

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

const schedules = [
  'Mon, Wed 10:00 AM',
  'Tue, Thu 02:00 PM',
  'Fri 09:00 AM',
  'Mon, Wed, Fri 11:00 AM',
  'Sat, Sun 04:00 PM',
  'Tue, Thu 10:00 AM',
  'Mon, Wed 03:00 PM'
];

const durations = [
  '1 hour',
  '1.5 hours',
  '2 hours',
  '45 mins'
];

let db;

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

async function createAdmin() {
  return new Promise(async (resolve) => {
    log('\n▶ CHECKING ADMIN ACCOUNT', 'blue');
    
    db.get(`SELECT * FROM admins WHERE email = ?`, ['admin@learnsphere.com'], async (err, row) => {
      if (row) {
        log(`  ✓ Admin account already exists`, 'green');
        resolve();
      } else {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
          `INSERT INTO admins (email, password) VALUES (?, ?)`,
          ['admin@learnsphere.com', hashedPassword],
          (err) => {
            if (!err) {
              log(`  ✓ Created default admin: admin@learnsphere.com`, 'green');
            } else {
              log(`  ✗ Error creating admin: ${err.message}`, 'red');
            }
            resolve();
          }
        );
      }
    });
  });
}

async function createCourses() {
  return new Promise((resolve) => {
    log('\n▶ CHECKING COURSES', 'blue');
    
    db.get(`SELECT COUNT(*) as count FROM courses`, [], (err, row) => {
      if (row && row.count > 0) {
        log(`  ✓ Courses already exist (${row.count} found)`, 'green');
        resolve();
        return;
      }

      log(`  ⚠ No courses found. Creating sample courses...`, 'yellow');
      const sampleCourses = [
        { name: 'Introduction to Programming', desc: 'Learn the basics of coding' },
        { name: 'Web Development Bootcamp', desc: 'Full stack web development' },
        { name: 'Data Science Fundamentals', desc: 'Introduction to data analysis' },
        { name: 'Mobile App Development', desc: 'Build iOS and Android apps' },
        { name: 'Database Management', desc: 'SQL and NoSQL databases' }
      ];

      let completed = 0;
      sampleCourses.forEach(course => {
        db.run(
          `INSERT INTO courses (course_name, description, teacher_id) VALUES (?, ?, ?)`,
          [course.name, course.desc, 2], // Assigning to teacher ID 2 by default
          (err) => {
            completed++;
            if (!err) {
              log(`    ✓ Created course: ${course.name}`, 'green');
            }
            if (completed === sampleCourses.length) resolve();
          }
        );
      });
    });
  });
}

async function populateSchedules() {
  return new Promise((resolve) => {
    log('\n▶ UPDATING SCHEDULES', 'blue');
    
    db.all(`SELECT course_id, course_name FROM courses`, [], (err, courses) => {
      if (err) {
        log(`✗ Error fetching courses: ${err.message}`, 'red');
        resolve();
        return;
      }

      if (courses.length === 0) {
        log(`⚠ No courses found to update`, 'yellow');
        resolve();
        return;
      }

      let completed = 0;
      courses.forEach((course) => {
        const schedule = schedules[Math.floor(Math.random() * schedules.length)];
        const duration = durations[Math.floor(Math.random() * durations.length)];

        db.run(
          `UPDATE courses SET schedule = ?, duration = ? WHERE course_id = ?`,
          [schedule, duration, course.course_id],
          (err) => {
            completed++;
            if (!err) {
              log(`  ✓ Updated ${course.course_name}: ${schedule} (${duration})`, 'green');
            } else {
              log(`  ✗ Error updating ${course.course_name}: ${err.message}`, 'red');
            }

            if (completed === courses.length) {
              resolve();
            }
          }
        );
      });
    });
  });
}

async function run() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════════╗', 'bold');
  log('║     ADMIN SCHEDULE POPULATION TOOL                           ║', 'bold');
  log('║           Learning Sphere - DB Project                       ║', 'bold');
  log('╚═══════════════════════════════════════════════════════════════╝', 'bold');

  await initializeDatabase();
  await createAdmin();
  await createCourses();
  await populateSchedules();

  log('\n╔═══════════════════════════════════════════════════════════════╗', 'bold');
  log('║          ✓ ALL OPERATIONS COMPLETED SUCCESSFULLY             ║', 'bold');
  log('╚═══════════════════════════════════════════════════════════════╝', 'bold');
  
  db.close();
}

// Run only when explicitly allowed to avoid accidental data seeding
if (require && require.main === module) {
  if (process.env.ALLOW_POPULATE === '1') {
    run();
  } else {
    log('Admin schedule population is disabled by default. To run, set environment variable ALLOW_POPULATE=1', 'yellow');
    process.exit(0);
  }
}
