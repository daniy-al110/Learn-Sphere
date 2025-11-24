// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "database.db");

// Debug hooks to capture exit and errors during startup/runtime
process.on('exit', (code) => {
  console.log('*** process exit event, code=' + code);
});
process.on('uncaughtException', (err) => {
  console.error('*** uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('*** unhandledRejection at:', promise, 'reason:', reason);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// ---------------------------
// Database connection & setup
// ---------------------------
let db; // Declare db first so helper functions can use it

// Helper functions for database promises
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);  // IMPORTANT
    });
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}



function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Root endpoint - serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/index.html"));
});

// Simple health check endpoint (used by client to verify server is running)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK', uptime: process.uptime(), timestamp: Date.now() });
});

// Initialize database
db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("❌ Failed to open database:", err.message);
    process.exit(1);
  }
  console.log("✅ SQLite DB opened:", DB_FILE);

  // Always enable foreign key constraints
  db.run("PRAGMA foreign_keys = ON");

  // Create student_grades table
  db.run(`
    CREATE TABLE IF NOT EXISTS student_grades (
      grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      course_id INTEGER,
      quiz_marks DECIMAL(5,2),
      assignment_marks DECIMAL(5,2),
      mid_marks DECIMAL(5,2),
      final_marks DECIMAL(5,2),
      total_marks DECIMAL(5,2),
      grade TEXT,
      cgpa REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);

  // Ensure cgpa column exists for older DBs (ALTER TABLE will error if column exists, ignore error)
  db.run(`ALTER TABLE student_grades ADD COLUMN cgpa REAL`, (err) => {
    // ignore error if column already exists
  });

  // Create tables if they don't exist
  db.serialize(() => {
    // Mid and Final Marks Table
    db.run(`
      CREATE TABLE IF NOT EXISTS mid_final_marks (
        mark_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        mid_marks DECIMAL(5,2) CHECK(mid_marks >= 0 AND mid_marks <= 30),
        final_marks DECIMAL(5,2) CHECK(final_marks >= 0 AND final_marks <= 40),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
        UNIQUE(student_id, course_id)
      )
    `);

    // Attendance Table
    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('present', 'absent')),
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);

    // Quizzes Table
    db.run(`
      CREATE TABLE IF NOT EXISTS quizzes (
        quiz_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        time_limit INTEGER,
        is_active BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);

    // Quiz Questions Table
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        question_id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        points INTEGER DEFAULT 1,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
      )
    `);

    // Quiz Responses Table
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_responses (
        response_id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER,
        student_id INTEGER,
        answers TEXT NOT NULL,
        score INTEGER,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
      )
    `);

    // Assignments Table
    db.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        link TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);

    // Assignment Submissions Table
    db.run(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER,
        student_id INTEGER,
        marks INTEGER,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
      )
    `);

    // Admins
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teachers
    db.run(`
      CREATE TABLE IF NOT EXISTS teachers (
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses (note: column course_name)
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        course_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        description TEXT,
        teacher_id INTEGER,
        schedule TEXT,
        duration TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
      )
    `);

    // Ensure backward compatibility: add schedule/duration columns if missing
    db.run(`ALTER TABLE courses ADD COLUMN schedule TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN duration TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN reviews_enabled INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN reviews_window_start TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN reviews_window_end TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN student_feedback_enabled INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN student_feedback_window_start TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE courses ADD COLUMN student_feedback_window_end TEXT`, (err) => { /* ignore if exists */ });

    // Enrollments
    db.run(`
      CREATE TABLE IF NOT EXISTS enrollments (
      enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      course_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      );
    `);

    // Enrollment Requests (new students or additional courses)
    db.run(`
      CREATE TABLE IF NOT EXISTS enrollment_requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        student_name TEXT NOT NULL,
        student_email TEXT,
        course_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        fee_amount DECIMAL(10,2) DEFAULT 500,
        challan_number TEXT UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        approved_at TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);

    // Migration: remove legacy `generated_password` and `generated_email` columns if present.
    // Use sequential async operations (runAsync) to avoid race conditions when rebuilding the table.
    (async () => {
      try {
        const cols = await allAsync("PRAGMA table_info(enrollment_requests)");
        if (!Array.isArray(cols)) return;
        const hasGenPass = cols.some(c => c.name === 'generated_password');
        const hasGenEmail = cols.some(c => c.name === 'generated_email');
        if (!hasGenPass && !hasGenEmail) return;

        console.log('Migration: found legacy columns (generated_password/generated_email) — rebuilding table without them');

        await runAsync('BEGIN TRANSACTION');

        // Create new table without generated_password and generated_email
        await runAsync(`
            CREATE TABLE IF NOT EXISTS enrollment_requests_new (
              request_id INTEGER PRIMARY KEY AUTOINCREMENT,
              student_id INTEGER,
              course_id INTEGER,
              student_name TEXT NOT NULL,
              student_email TEXT,
              course_name TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              fee_amount DECIMAL(10,2) DEFAULT 500,
              challan_number TEXT UNIQUE,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              approved_at TEXT,
              FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
              FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
            )
          `);

        // Copy data (omit generated_password and generated_email)
        await runAsync(`INSERT INTO enrollment_requests_new (request_id, student_id, course_id, student_name, student_email, course_name, status, fee_amount, challan_number, created_at, approved_at)
                  SELECT request_id, student_id, course_id, student_name, student_email, course_name, status, fee_amount, challan_number, created_at, approved_at FROM enrollment_requests`);

        await runAsync('DROP TABLE IF EXISTS enrollment_requests');
        await runAsync('ALTER TABLE enrollment_requests_new RENAME TO enrollment_requests');
        await runAsync('COMMIT');

        console.log('Migration: enrollment_requests table rebuilt without legacy generated columns');
      } catch (e) {
        console.error('Migration failed:', e && e.message ? e.message : e);
        try { await runAsync('ROLLBACK'); } catch (er) { /* ignore */ }
      }
    })();

    // Fee Challans
    db.run(`
      CREATE TABLE IF NOT EXISTS fee_challans (
        challan_id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER,
        challan_number TEXT UNIQUE NOT NULL,
        student_name TEXT NOT NULL,
        course_name TEXT NOT NULL,
        amount DECIMAL(10,2),
        status TEXT DEFAULT 'unpaid',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES enrollment_requests(request_id) ON DELETE CASCADE
      )
    `);

    // Feedback
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        teacher_id INTEGER,
        rating INTEGER,
        review TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
      );
    `);
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique ON feedback (student_id, teacher_id, course_id)`);

    // Teacher reviews for students
    db.run(`
      CREATE TABLE IF NOT EXISTS teacher_reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        rating INTEGER,
        review TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      );
    `);
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_review_unique ON teacher_reviews (teacher_id, student_id, course_id)`);

    // Instructor performance reports (submitted by students or admins)
    db.run(`
      CREATE TABLE IF NOT EXISTS instructor_performance (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        period_start TEXT,
        period_end TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comments TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
      );
    `);

    // Internal messaging
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        receiver_id INTEGER,
        sender_key TEXT,
        receiver_key TEXT,
        sender_name TEXT,
        receiver_name TEXT,
        subject TEXT DEFAULT 'No Subject',
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add subject column to messages table if it doesn't exist (migration)
    db.run(`
      ALTER TABLE messages ADD COLUMN subject TEXT DEFAULT 'No Subject'
    `, (err) => {
      // Column already exists or successfully added, ignore error
    });

    // Contact table and compatibility view removed per project housekeeping.
    // The legacy `contact_us` table and the compatibility view "Contact Us" have been removed intentionally.
    // If you need to restore contact functionality later, re-add the table and endpoint intentionally.


    // Student submits feedback for a course
    app.post("/api/student/feedback", async (req, res) => {
      const { student_id, course_id, teacher_id, rating, review } = req.body;
      if (!student_id || !course_id || !teacher_id || !rating || !review) {
        return res
          .status(400)
          .json({ success: false, error: "Missing fields" });
      }
      try {
        const course = await getAsync('SELECT student_feedback_enabled, student_feedback_window_start, student_feedback_window_end FROM courses WHERE course_id = ?', [course_id]);
        // If the course row is missing, return an error
        if (!course) {
          return res.status(404).json({ success: false, error: 'Course not found' });
        }
        // Treat missing/null student_feedback_enabled as enabled (backwards compatible)
        const sfFlag = (course.student_feedback_enabled === undefined || course.student_feedback_enabled === null) ? 1 : Number(course.student_feedback_enabled);
        if (!sfFlag) {
          return res.status(403).json({ success: false, error: 'Student feedback disabled' });
        }
        if (course.student_feedback_window_start || course.student_feedback_window_end) {
          const now = new Date();
          const normStart = course.student_feedback_window_start ? String(course.student_feedback_window_start).replace(' ', 'T') : null;
          const normEnd = course.student_feedback_window_end ? String(course.student_feedback_window_end).replace(' ', 'T') : null;
          const startOk = normStart ? now >= new Date(normStart) : true;
          const endOk = normEnd ? now <= new Date(normEnd) : true;
          if (!(startOk && endOk)) {
            return res.status(403).json({ success: false, error: 'Student feedback window closed' });
          }
        }

        // If feedback already exists for this student/teacher/course, decide whether to update or reject
        const existing = await getAsync('SELECT feedback_id, created_at FROM feedback WHERE student_id = ? AND teacher_id = ? AND course_id = ?', [student_id, teacher_id, course_id]);
        if (existing) {
          // Normalize DB datetime to JS Date (replace space with T)
          const existingCreated = existing.created_at ? new Date(String(existing.created_at).replace(' ', 'T')) : null;
          const windowStart = course.student_feedback_window_start ? new Date(String(course.student_feedback_window_start).replace(' ', 'T')) : null;
          const windowEnd = course.student_feedback_window_end ? new Date(String(course.student_feedback_window_end).replace(' ', 'T')) : null;

          // If a feedback window is defined, and the existing feedback was created inside that window, disallow re-submission in the same period.
          if (windowStart || windowEnd) {
            const inWindow = (windowStart ? existingCreated >= windowStart : true) && (windowEnd ? existingCreated <= windowEnd : true);
            if (inWindow) {
              return res.status(403).json({ success: false, error: 'Feedback already submitted in this feedback period' });
            }
            // existing feedback is outside current window -> allow update
            await runAsync('UPDATE feedback SET rating = ?, review = ?, created_at = CURRENT_TIMESTAMP WHERE feedback_id = ?', [rating, review, existing.feedback_id]);
            return res.json({ success: true, message: 'Feedback updated (outside previous period)' });
          }

          // No feedback window defined: treat the previous submission as part of the same period -> reject further submissions
          return res.status(403).json({ success: false, error: 'Feedback already submitted' });
        }

        await runAsync(
          `INSERT INTO feedback (student_id, course_id, teacher_id, rating, review) VALUES (?, ?, ?, ?, ?)`,
          [student_id, course_id, teacher_id, rating, review]
        );
        res.json({ success: true, message: "Feedback submitted" });
      } catch (err) {
        console.error("Feedback error:", err && err.message ? err.message : err);
        // Handle unique constraint gracefully just in case of race conditions
        if (err && err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ success: false, error: 'Feedback already exists' });
        }
        res.status(500).json({ success: false, error: err.message || String(err) });
      }
    });

    // Teacher gets feedback for their course (shows only student_id)
    app.get("/api/teacher/courses/:courseId/feedback", async (req, res) => {
      try {
        const courseId = req.params.courseId;
        const feedbacks = await allAsync(
          `SELECT student_id, rating, review, created_at FROM feedback WHERE course_id = ?`,
          [courseId]
        );
        res.json({ success: true, feedbacks });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });

    // Teacher submits a review for a student in a course
    // Behavior: a teacher may submit once per configured review window. If a previous review
    // exists for the same (teacher, student, course) then:
    // - if a window is defined and the existing review was created inside that window -> reject
    // - if the existing review is outside the current window -> allow update (treated as new-period submission)
    // - if no window is defined -> reject duplicate submissions
    app.post('/api/teacher/student-review', async (req, res) => {
      try {
        const { teacher_id, student_id, course_id, rating, review } = req.body;
        if (!teacher_id || !student_id || !course_id || !rating || !review) {
          return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        const course = await getAsync('SELECT teacher_id, reviews_enabled, reviews_window_start, reviews_window_end FROM courses WHERE course_id = ?', [course_id]);
        if (!course) {
          return res.status(400).json({ success: false, error: 'Course not found' });
        }
        if (String(course.teacher_id) !== String(teacher_id)) {
          return res.status(403).json({ success: false, error: 'Not authorized for this course' });
        }
        if (!course.reviews_enabled) {
          return res.status(403).json({ success: false, error: 'Reviews disabled by admin' });
        }

        // If a window is set, ensure we're inside it now
        if (course.reviews_window_start || course.reviews_window_end) {
          const now = new Date();
          const normStart = course.reviews_window_start ? String(course.reviews_window_start).replace(' ', 'T') : null;
          const normEnd = course.reviews_window_end ? String(course.reviews_window_end).replace(' ', 'T') : null;
          const startOk = normStart ? now >= new Date(normStart) : true;
          const endOk = normEnd ? now <= new Date(normEnd) : true;
          if (!(startOk && endOk)) {
            return res.status(403).json({ success: false, error: 'Review window closed' });
          }
        }

        // Check for existing review
        const existing = await getAsync('SELECT review_id, created_at FROM teacher_reviews WHERE teacher_id = ? AND student_id = ? AND course_id = ?', [teacher_id, student_id, course_id]);
        if (existing) {
          const existingCreated = existing.created_at ? new Date(String(existing.created_at).replace(' ', 'T')) : null;
          const windowStart = course.reviews_window_start ? new Date(String(course.reviews_window_start).replace(' ', 'T')) : null;
          const windowEnd = course.reviews_window_end ? new Date(String(course.reviews_window_end).replace(' ', 'T')) : null;

          if (windowStart || windowEnd) {
            const inWindow = (windowStart ? existingCreated >= windowStart : true) && (windowEnd ? existingCreated <= windowEnd : true);
            if (inWindow) {
              return res.status(403).json({ success: false, error: 'Review already submitted in this review period' });
            }
            // existing review is outside current window -> allow update
            await runAsync('UPDATE teacher_reviews SET rating = ?, review = ?, created_at = CURRENT_TIMESTAMP WHERE review_id = ?', [rating, review, existing.review_id]);
            return res.json({ success: true, message: 'Review updated (outside previous period)' });
          }

          // No review window defined: treat previous submission as final
          return res.status(403).json({ success: false, error: 'Review already submitted' });
        }

        // Insert new review
        await runAsync('INSERT INTO teacher_reviews (teacher_id, student_id, course_id, rating, review) VALUES (?, ?, ?, ?, ?)', [teacher_id, student_id, course_id, rating, review]);
        res.json({ success: true });
      } catch (err) {
        console.error('Teacher review error:', err && err.message ? err.message : err);
        if (err && err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ success: false, error: 'Review already exists' });
        }
        res.status(500).json({ success: false, error: err.message || String(err) });
      }
    });

    // Get teacher reviews for a course
    app.get('/api/teacher/course/:courseId/reviews', async (req, res) => {
      try {
        const courseId = req.params.courseId;
        const rows = await allAsync(
          `SELECT tr.review_id, tr.teacher_id, tr.student_id, s.name as student_name, tr.rating, tr.review, tr.created_at
           FROM teacher_reviews tr JOIN students s ON tr.student_id = s.student_id
           WHERE tr.course_id = ? ORDER BY tr.created_at DESC`,
          [courseId]
        );
        res.json({ success: true, reviews: rows });
      } catch (err) {
        console.error('Get teacher reviews error:', err.message);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    console.log("✅ Tables are ensured.");
  });
});

// Ensure certificates folder exists (for generated certificates)
const fs = require('fs');
const certsDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir);

// Create certificate requests table
db.run(`
  CREATE TABLE IF NOT EXISTS certificate_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    teacher_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending | approved | rejected
    generated_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
  )
`);

// Student requests a certificate for a course
app.post('/api/student/certificate-request', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) return res.status(400).json({ success: false, error: 'Missing fields' });

    // find teacher for the course
    const course = await getAsync('SELECT course_id, course_name, teacher_id FROM courses WHERE course_id = ?', [courseId]);
    if (!course) return res.status(400).json({ success: false, error: 'Course not found' });

    // Check for an existing approved request for this student+course
    const existingApproved = await getAsync('SELECT * FROM certificate_requests WHERE student_id = ? AND course_id = ? AND status = ?', [studentId, courseId, 'approved']);
    if (existingApproved) {
      return res.status(200).json({ success: true, message: 'Certificate already approved', requestId: existingApproved.request_id, generated_path: existingApproved.generated_path });
    }

    // If a pending request exists, return a helpful response and do not create a duplicate
    const existingPending = await getAsync('SELECT * FROM certificate_requests WHERE student_id = ? AND course_id = ? AND status = ?', [studentId, courseId, 'pending']);
    if (existingPending) {
      return res.status(409).json({ success: false, error: 'A certificate request for this course is already pending' });
    }

    const result = await runAsync(`INSERT INTO certificate_requests (student_id, course_id, teacher_id, status) VALUES (?, ?, ?, 'pending')`, [studentId, courseId, course.teacher_id]);
    res.json({ success: true, requestId: result.lastID });
  } catch (err) {
    console.error('Certificate request error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Teacher: list certificate requests for their courses
app.get('/api/teacher/certificate-requests/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const rows = await allAsync(`SELECT cr.*, s.name as student_name, c.course_name FROM certificate_requests cr JOIN students s ON cr.student_id = s.student_id JOIN courses c ON cr.course_id = c.course_id WHERE cr.teacher_id = ? ORDER BY cr.created_at DESC`, [teacherId]);
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error('List certificate requests error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to create a simple SVG certificate with name & course text
function createCertificateSvg(studentName, courseName) {
  const now = new Date().toLocaleDateString();
  // More polished certificate with centered name and decorative borders
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000">
    <defs>
      <style type="text/css"><![CDATA[
        .bg { fill: #ffffff; }
        .frame { fill: none; stroke: #0f172a; stroke-width: 6; }
        .thin { stroke-width: 3; }
        .title { font-family: 'Playfair Display', Georgia, serif; font-size: 48px; fill: #0f172a; letter-spacing: 8px; }
        .subtitle { font-family: 'Arial', sans-serif; font-size: 22px; fill: #334155; }
        .name { font-family: 'Georgia', serif; font-size: 56px; fill: #0b1220; font-weight: 700; }
        .course { font-family: 'Arial', sans-serif; font-size: 20px; fill: #374151; }
        .footer { font-family: 'Arial', sans-serif; font-size: 16px; fill: #475569; }
      ]]></style>
    </defs>
    <rect width="100%" height="100%" class="bg" />
    <!-- outer decorative lines -->
    <rect x="40" y="40" width="1320" height="920" class="frame" rx="12" />
    <line x1="80" y1="120" x2="1320" y2="120" class="thin frame" />
    <line x1="80" y1="880" x2="1320" y2="880" class="thin frame" />

    <!-- Logo placeholder (top center) -->
    <g transform="translate(700,180) scale(1)">
      <path d="M-30,-20 L0,-60 L30,-20 L0,20 Z" fill="#0f172a" />
    </g>

    <!-- Title -->
    <text x="700" y="280" class="title" text-anchor="middle">CERTIFICATE OF COMPLETION</text>

    <!-- Subtitle -->
    <text x="700" y="340" class="subtitle" text-anchor="middle">This is to certify that</text>

    <!-- Student name centered -->
    <text x="700" y="460" class="name" text-anchor="middle">${escapeXml(studentName)}</text>

    <!-- Course description -->
    <text x="700" y="520" class="course" text-anchor="middle">has successfully completed the online course</text>
    <text x="700" y="555" class="course" text-anchor="middle">"${escapeXml(courseName)}"</text>

    <!-- Signature block -->
    <g transform="translate(240,760)">
      <text x="0" y="0" class="footer">ACADEMIC</text>
      <text x="0" y="24" class="footer">Head of Academic</text>
      <text x="0" y="48" class="footer">Learn Sphere</text>
    </g>

    <g transform="translate(980,720)">
      <circle cx="120" cy="50" r="64" stroke="#0f172a" stroke-width="3" fill="none" />
      <path d="M20,110 C80,50 160,90 220,40" stroke="#0f172a" stroke-width="6" fill="none" stroke-linecap="round" />
      <text x="120" y="155" text-anchor="middle" class="footer">Signature</text>
    </g>

    <!-- issued date -->
    <text x="120" y="940" class="footer">Issued on: ${escapeXml(now)}</text>

  </svg>`;
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"\\]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      case "\\": return '&#92;';
    }
  });
}

// Teacher accepts a certificate request -> generate certificate and mark approved
app.post('/api/teacher/certificate/:requestId/accept', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const reqRow = await getAsync('SELECT cr.*, s.name as student_name, c.course_name FROM certificate_requests cr JOIN students s ON cr.student_id = s.student_id JOIN courses c ON cr.course_id = c.course_id WHERE cr.request_id = ?', [requestId]);
    if (!reqRow) return res.status(404).json({ success: false, error: 'Request not found' });

    // generate SVG certificate
    const svg = createCertificateSvg(reqRow.student_name, reqRow.course_name);
    const svgFilename = `certificate_${requestId}.svg`;
    const svgPath = path.join(certsDir, svgFilename);
    fs.writeFileSync(svgPath, svg, 'utf8');

    // Try to convert to PNG if sharp is available
    let finalPath = `/certificates/${svgFilename}`;
    try {
      let sharp;
      try { sharp = require('sharp'); } catch (e) { sharp = null; }
      if (sharp) {
        const pngFilename = `certificate_${requestId}.png`;
        const pngPath = path.join(certsDir, pngFilename);
        // convert SVG buffer to PNG 1200x800
        await sharp(Buffer.from(svg)).png().toFile(pngPath);
        finalPath = `/certificates/${pngFilename}`;
      }
    } catch (convErr) {
      console.error('SVG->PNG conversion failed, serving SVG instead', convErr.message);
    }

    // update DB
    await runAsync('UPDATE certificate_requests SET status = ?, generated_path = ? WHERE request_id = ?', ['approved', finalPath, requestId]);
    res.json({ success: true, path: finalPath });
  } catch (err) {
    console.error('Accept certificate error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Download certificate (serves file with Content-Disposition to force download)
app.get('/api/certificates/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) return res.status(400).json({ success: false, error: 'Invalid filename' });
    const filePath = path.join(certsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(filePath);
  } catch (err) {
    console.error('Certificate download error:', err && err.message ? err.message : err);
    res.status(500).json({ success: false, error: 'Failed to serve file' });
  }
});

// Teacher rejects a certificate request
app.post('/api/teacher/certificate/:requestId/reject', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const reqRow = await getAsync('SELECT * FROM certificate_requests WHERE request_id = ?', [requestId]);
    if (!reqRow) return res.status(404).json({ success: false, error: 'Request not found' });
    await runAsync('UPDATE certificate_requests SET status = ? WHERE request_id = ?', ['rejected', requestId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Reject certificate error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------
// Helper: to run SQL with promise (for convenience)
// ---------------------------
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // allows accessing this.lastID, this.changes
    });
  });
}
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// ---------------------------
// Routes: Admin
// ---------------------------

// Admin signup
app.post("/api/admin/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);
    await runAsync(`INSERT INTO admins (email, password) VALUES (?, ?)`, [
      email,
      hashed,
    ]);
    res.json({ success: true, message: "Admin created" });
  } catch (err) {
    console.error("Admin signup error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: "Missing fields" });

  db.get(
    `SELECT * FROM admins WHERE email = ?`,
    [email],
    async (err, admin) => {
      if (err) {
        console.error("Admin login DB error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!admin)
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });

      const ok = await bcrypt.compare(password, admin.password);
      if (!ok)
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });

      // Do NOT send password back
      delete admin.password;
      res.json({ success: true, admin });
    }
  );
});

// ---------------------------
// Routes: Teachers (Admin-managed)
// ---------------------------

// Add teacher
app.post("/api/admin/add-teacher", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: "Missing fields" });

    // Check if email already exists
    const existing = await getAsync('SELECT teacher_id FROM teachers WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already exists. Please use a different email address." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await runAsync(
      `INSERT INTO teachers (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashed]
    );
    res.json({ success: true, teacher_id: result.lastID });
  } catch (err) {
    console.error("Add teacher error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// List teachers
app.get("/api/admin/teachers", (req, res) => {
  db.all(
    `SELECT teacher_id, name, email, created_at FROM teachers ORDER BY teacher_id DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("List teachers error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, teachers: rows });
    }
  );
});

// Remove teacher
// Remove teacher (safe delete: remove dependent rows first)
app.delete("/api/admin/remove-teacher/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // Start transaction
    await runAsync('BEGIN TRANSACTION');

    // Defensive deletions: remove any rows that reference this teacher but do not have ON DELETE CASCADE
    try {
      await runAsync('DELETE FROM certificate_requests WHERE teacher_id = ?', [id]);
      await runAsync('DELETE FROM feedback WHERE teacher_id = ?', [id]);
      await runAsync('DELETE FROM teacher_reviews WHERE teacher_id = ?', [id]);
      await runAsync('DELETE FROM instructor_performance WHERE teacher_id = ?', [id]);
    } catch (e) {
      console.error('Pre-clean deletions error (non-critical):', e && e.message ? e.message : e);
    }

    // Get courses taught by this teacher (if any)
    const courses = await allAsync('SELECT course_id FROM courses WHERE teacher_id = ?', [id]);
    const courseIds = (courses || []).map(c => c.course_id).filter(Boolean);

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');

      // Remove dependent data for these courses in a safe order
      await runAsync(`DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id IN (${placeholders}))`, courseIds);
      await runAsync(`DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id IN (${placeholders}))`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM assignments WHERE course_id IN (${placeholders})`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM quiz_responses WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id IN (${placeholders}))`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM quiz_questions WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id IN (${placeholders}))`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM quizzes WHERE course_id IN (${placeholders})`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM attendance WHERE course_id IN (${placeholders})`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM enrollments WHERE course_id IN (${placeholders})`, courseIds).catch(() => { });
      await runAsync(`DELETE FROM student_grades WHERE course_id IN (${placeholders})`, courseIds).catch(() => { });

      // Finally delete the courses themselves
      await runAsync(`DELETE FROM courses WHERE course_id IN (${placeholders})`, courseIds);
    }

    // Last, delete any remaining direct references and remove the teacher
    await runAsync('DELETE FROM certificate_requests WHERE teacher_id = ?', [id]).catch(() => { });
    const result = await runAsync('DELETE FROM teachers WHERE teacher_id = ?', [id]);

    await runAsync('COMMIT');
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Remove teacher error:', err.message);
    try { await runAsync('ROLLBACK'); } catch (e) { /* ignore */ }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Teacher login
app.post("/api/teacher/login", (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM teachers WHERE email = ?`, [email], async (err, t) => {
    if (err) {
      console.error("Teacher login DB error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!t)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, t.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    delete t.password;
    res.json({ success: true, teacher: t });
  });
});

// ---------------------------
// Routes: Students (Admin-managed)
// ---------------------------

// Add student
// Add student - safe version
app.post("/api/admin/add-student", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing fields",
      });
    }

    // HASH PASSWORD first
    const hashed = await bcrypt.hash(password, 10);

    // Use INSERT OR IGNORE to safely prevent duplicates
    const result = await runAsync(
      "INSERT OR IGNORE INTO students (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    console.log("INSERT RESULT:", result);

    if (result.changes === 0) {
      // Email already exists
      return res.status(409).json({
        success: false,
        error: "Email already exists. Please use a different email address.",
      });
    }

    return res.json({
      success: true,
      student_id: result.lastID,
    });

  } catch (err) {
    console.error("FULL ERROR OBJECT:", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});



// List students
app.get("/api/admin/students", (req, res) => {
  db.all(
    `SELECT student_id, name, email, created_at FROM students ORDER BY student_id DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("List students error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, students: rows });
    }
  );
});

// Remove student
// Remove student (safe delete: remove dependent rows first)
app.delete("/api/admin/remove-student/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await runAsync('BEGIN TRANSACTION');

    // Attendance
    console.log(`Deleting attendance for student ${id}`);
    await runAsync('DELETE FROM attendance WHERE student_id = ?', [id]);
    console.log(`Deleted attendance for student ${id}`);

    // Enrollments
    console.log(`Deleting enrollments for student ${id}`);
    await runAsync('DELETE FROM enrollments WHERE student_id = ?', [id]);
    console.log(`Deleted enrollments for student ${id}`);

    // Quiz responses
    console.log(`Deleting quiz_responses for student ${id}`);
    await runAsync('DELETE FROM quiz_responses WHERE student_id = ?', [id]);
    console.log(`Deleted quiz_responses for student ${id}`);

    // Assignment submissions
    console.log(`Deleting assignment_submissions for student ${id}`);
    await runAsync('DELETE FROM assignment_submissions WHERE student_id = ?', [id]);
    console.log(`Deleted assignment_submissions for student ${id}`);

    // Feedback entries
    console.log(`Deleting feedback for student ${id}`);
    await runAsync('DELETE FROM feedback WHERE student_id = ?', [id]);
    console.log(`Deleted feedback for student ${id}`);

    // Student grades and mid/final marks (these tables reference students without ON DELETE CASCADE in older schemas)
    console.log(`Deleting student_grades for student ${id}`);
    await runAsync('DELETE FROM student_grades WHERE student_id = ?', [id]);
    console.log(`Deleted student_grades for student ${id}`);

    console.log(`Deleting mid_final_marks for student ${id}`);
    await runAsync('DELETE FROM mid_final_marks WHERE student_id = ?', [id]);
    console.log(`Deleted mid_final_marks for student ${id}`);

    // Certificate requests (some schemas reference student without cascade)
    await runAsync('DELETE FROM certificate_requests WHERE student_id = ?', [id]);

    // Messages (no FK but remove user messages to avoid orphaned UX references)
    await runAsync('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [id, id]);

    // Finally delete student record
    const result = await runAsync('DELETE FROM students WHERE student_id = ?', [id]);

    await runAsync('COMMIT');
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Remove student error:', err.message);
    try { await runAsync('ROLLBACK'); } catch (e) { /* ignore */ }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Student login
app.post("/api/student/login", (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM students WHERE email = ?`, [email], async (err, s) => {
    if (err) {
      console.error("Student login DB error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!s)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, s.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    delete s.password;
    res.json({ success: true, student: s });
  });
});

// Student  signup (self-registration)
app.post("/api/student/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: "Missing fields" });

    // Check if email already exists
    const existing = await getAsync('SELECT student_id FROM students WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already exists. Please use a different email address." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await runAsync(
      `INSERT INTO students (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashed]
    );
    res.json({ success: true, student_id: result.lastID, message: "Account created successfully" });
  } catch (err) {
    console.error("Student signup error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get student's attendance records
app.get("/api/student/attendance/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const data = await allAsync(`
      SELECT 
        c.course_id, 
        c.course_name,
        GROUP_CONCAT(a.date || '|' || a.status) as attendance_details,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(CASE 
          WHEN COUNT(a.attendance_id) = 0 THEN 0 
          ELSE (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.attendance_id)) 
        END, 2) AS attendance_percentage
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN attendance a ON c.course_id = a.course_id AND a.student_id = ?
      WHERE e.student_id = ?
      GROUP BY c.course_id, c.course_name
    `, [studentId, studentId]);

    // Process attendance details
    const processed = data.map(course => ({
      ...course,
      attendance_details: course.attendance_details ?
        course.attendance_details.split(',').map(record => {
          const [date, status] = record.split('|');
          return { date, status };
        }) : []
    }));

    res.json({ success: true, data: processed });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance records' });
  }
});

// Get student's available quizzes
app.get('/api/student/:studentId/quizzes', async (req, res) => {
  const { studentId } = req.params;
  try {
    const data = await allAsync(`
      SELECT 
        q.quiz_id,
        q.title,
        q.description,
        q.time_limit,
        q.is_active,
        c.course_id,
        c.course_name,
        qr.score as student_score,
        qr.submitted_at,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.quiz_id) as total_questions
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN quizzes q ON c.course_id = q.course_id
      LEFT JOIN quiz_responses qr ON q.quiz_id = qr.quiz_id AND qr.student_id = ?
      WHERE e.student_id = ?
      ORDER BY q.created_at DESC
    `, [studentId, studentId]);

    res.json({ success: true, quizzes: data });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch quizzes' });
  }
});

// Get student's assignments
app.get('/api/student/:studentId/assignments', async (req, res) => {
  const { studentId } = req.params;
  try {
    const data = await allAsync(`
      SELECT 
        a.assignment_id, 
        a.title, 
        a.description, 
        a.link, 
        a.due_date, 
        a.created_at,
        c.course_id,
        c.course_name,
        s.submission_id,
        s.marks,
        s.submitted_at,
        CASE 
          WHEN s.submitted_at IS NOT NULL THEN 'submitted'
          WHEN date('now') > date(a.due_date) THEN 'overdue'
          ELSE 'pending'
        END as status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN assignments a ON c.course_id = a.course_id
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ?
      WHERE e.student_id = ?
      ORDER BY a.due_date ASC
    `, [studentId, studentId]);

    res.json({ success: true, assignments: data });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// Get student's certificate requests
app.get('/api/student/:studentId/certificate-requests', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const rows = await allAsync(`SELECT cr.*, c.course_name FROM certificate_requests cr JOIN courses c ON cr.course_id = c.course_id WHERE cr.student_id = ? ORDER BY cr.created_at DESC`, [studentId]);
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error('Student certificate requests error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------
// Routes: Courses (Admin & Teacher)
// ---------------------------

// Add course (Admin)
app.post("/api/admin/add-course", (req, res) => {
  console.log("📩 Add course request body:", req.body);
  const { course_name, description, teacher_id } = req.body;

  if (!course_name || !description) {
    console.log("⚠️ Missing fields for add-course");
    return res
      .status(400)
      .json({ success: false, error: "Course name and description required" });
  }

  if (teacher_id) {
    db.get(
      `SELECT teacher_id FROM teachers WHERE teacher_id = ?`,
      [teacher_id],
      (err, row) => {
        if (err) {
          console.error("Teacher lookup error:", err.message);
          return res
            .status(500)
            .json({ success: false, error: "Database error" });
        }
        if (!row) {
          return res
            .status(400)
            .json({ success: false, error: "Teacher ID does not exist" });
        }
        db.run(
          `INSERT INTO courses (course_name, description, teacher_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [course_name, description, teacher_id],
          function (err) {
            if (err) {
              console.error("Add course SQL error:", err.message);
              return res
                .status(500)
                .json({ success: false, error: err.message });
            }
            console.log("✅ Course added ID:", this.lastID);
            res.json({ success: true, course_id: this.lastID });
          }
        );
      }
    );
  } else {
    db.run(
      `INSERT INTO courses (course_name, description, teacher_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [course_name, description, null],
      function (err) {
        if (err) {
          console.error("Add course SQL error:", err.message);
          return res.status(500).json({ success: false, error: err.message });
        }
        console.log("✅ Course added ID:", this.lastID);
        res.json({ success: true, course_id: this.lastID });
      }
    );
  }
});

// Add course (Teacher route, same behavior)
app.post("/api/teacher/add-course", (req, res) => {
  const { course_name, description, teacher_id } = req.body;
  if (!course_name || !description)
    return res.status(400).json({ success: false, error: "Missing fields" });

  db.run(
    `INSERT INTO courses (course_name, description, teacher_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [course_name, description, teacher_id || null],
    function (err) {
      if (err) {
        console.error("Teacher add-course SQL error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.status(201).json({ success: true, course_id: this.lastID });
    }
  );
});

// List courses (Admin)
app.get("/api/admin/courses", (req, res) => {
  const q = `SELECT course_id, course_name, description, teacher_id, schedule, duration, reviews_enabled, reviews_window_start, reviews_window_end, created_at FROM courses ORDER BY course_id DESC`;
  db.all(q, [], (err, rows) => {
    if (err) {
      console.error("List courses error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    // Normalize datetime format for frontend (convert 'YYYY-MM-DD HH:MM:SS' to 'YYYY-MM-DDTHH:MM:SS' so new Date(...) parses reliably)
    const norm = (v) => (v ? String(v).replace(' ', 'T') : v);
    const courses = (rows || []).map(r => ({
      ...r,
      reviews_window_start: norm(r.reviews_window_start),
      reviews_window_end: norm(r.reviews_window_end)
    }));
    res.json({ success: true, courses });
  });
});

// Remove course
app.delete("/api/admin/remove-course/:id", (req, res) => {
  (async () => {
    const id = req.params.id;
    const cascade = String(req.query.cascade || '').toLowerCase() === 'true' || req.query.cascade === '1';
    try {
      // Check for dependent records that would block deletion
      const deps = await getAsync(
        `SELECT
           (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) AS enrollments_count,
           (SELECT COUNT(*) FROM assignments WHERE course_id = ?) AS assignments_count,
           (SELECT COUNT(*) FROM quizzes WHERE course_id = ?) AS quizzes_count,
           (SELECT COUNT(*) FROM attendance WHERE course_id = ?) AS attendance_count,
           (SELECT COUNT(*) FROM student_grades WHERE course_id = ?) AS grades_count
         `,
        [id, id, id, id, id]
      );

      const blockers = [];
      if (deps && deps.enrollments_count && deps.enrollments_count > 0) blockers.push({ type: 'enrollments', count: deps.enrollments_count });
      if (deps && deps.assignments_count && deps.assignments_count > 0) blockers.push({ type: 'assignments', count: deps.assignments_count });
      if (deps && deps.quizzes_count && deps.quizzes_count > 0) blockers.push({ type: 'quizzes', count: deps.quizzes_count });
      if (deps && deps.attendance_count && deps.attendance_count > 0) blockers.push({ type: 'attendance', count: deps.attendance_count });
      if (deps && deps.grades_count && deps.grades_count > 0) blockers.push({ type: 'grades', count: deps.grades_count });

      if (blockers.length && !cascade) {
        // Do not attempt delete — return a clear 409 conflict with details so front-end can show a helpful message
        return res.status(409).json({
          success: false,
          error: 'Course has dependent records and cannot be deleted',
          dependencies: blockers,
          hint: 'Remove or reassign dependent enrollments/assignments/quizzes, or retry with ?cascade=true to delete related data.'
        });
      }

      if (cascade) {
        // Perform cascade deletion in a transaction (delete children first)
        try {
          await runAsync('BEGIN TRANSACTION');
          // Remove submissions/responses first
          await runAsync('DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM assignments WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM quiz_responses WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM quiz_questions WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM quizzes WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM attendance WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM enrollments WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM student_grades WHERE course_id = ?', [id]);
          const result = await runAsync('DELETE FROM courses WHERE course_id = ?', [id]);
          await runAsync('COMMIT');
          return res.json({ success: true, deleted: result.changes });
        } catch (err) {
          console.error('Cascade delete failed:', err && err.message ? err.message : err);
          try { await runAsync('ROLLBACK'); } catch (e) { }
          return res.status(500).json({ success: false, error: err.message || String(err) });
        }
      }

      // No blockers -> safe to delete
      db.run(`DELETE FROM courses WHERE course_id = ?`, [id], function (err) {
        if (err) {
          console.error('Remove course error:', err.message);
          if (String(err.message).toLowerCase().includes('foreign key')) {
            return res.status(409).json({ success: false, error: 'Could not delete: dependent records exist', details: err.message });
          }
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, deleted: this.changes });
      });
    } catch (err) {
      console.error('Remove course (check) error:', err && err.message ? err.message : err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  })();
});

// Get course details (used by client when rendering enrolled courses)
app.get('/api/courses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const course = await getAsync(`SELECT course_id, course_name as name, description, teacher_id, schedule, duration, created_at, reviews_enabled, reviews_window_start, reviews_window_end, student_feedback_enabled, student_feedback_window_start, student_feedback_window_end FROM courses WHERE course_id = ?`, [id]);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    // Normalize stored datetimes to 'T' format for frontend parsing
    const norm = (v) => (v ? String(v).replace(' ', 'T') : v);
    const out = {
      ...course,
      reviews_window_start: norm(course.reviews_window_start),
      reviews_window_end: norm(course.reviews_window_end),
      student_feedback_window_start: norm(course.student_feedback_window_start),
      student_feedback_window_end: norm(course.student_feedback_window_end),
    };
    res.json({ success: true, course: out });
  } catch (err) {
    console.error('Get course error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update course (partial update: schedule, duration, description, teacher_id)
app.put('/api/courses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`PUT /api/courses/${id} - Request received`);
    let { schedule, duration, description, teacher_id, course_name, reviews_enabled, reviews_window_start, reviews_window_end, student_feedback_enabled, student_feedback_window_start, student_feedback_window_end } = req.body;

    // Check if course exists first
    const courseExists = await getAsync('SELECT course_id FROM courses WHERE course_id = ?', [id]);
    if (!courseExists) {
      console.error(`Course ${id} not found in database`);
      return res.status(404).json({ success: false, error: `Course ${id} not found` });
    }
    console.log(`✓ Course ${id} found in database`);

    // Normalize incoming datetime-local values (YYYY-MM-DDTHH:MM or with seconds) to DB-friendly format with space
    const normalizeIn = (v) => {
      if (!v) return v;
      // If contains 'T', replace with space; also trim seconds if present without seconds OK.
      return String(v).replace('T', ' ');
    };
    if (reviews_window_start) reviews_window_start = normalizeIn(reviews_window_start);
    if (reviews_window_end) reviews_window_end = normalizeIn(reviews_window_end);
    if (student_feedback_window_start) student_feedback_window_start = normalizeIn(student_feedback_window_start);
    if (student_feedback_window_end) student_feedback_window_end = normalizeIn(student_feedback_window_end);

    // Build dynamic SQL
    const sets = [];
    const params = [];
    if (schedule !== undefined) { sets.push('schedule = ?'); params.push(schedule); }
    if (duration !== undefined) { sets.push('duration = ?'); params.push(duration); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (teacher_id !== undefined) { sets.push('teacher_id = ?'); params.push(teacher_id); }
    if (course_name !== undefined) { sets.push('course_name = ?'); params.push(course_name); }
    if (reviews_enabled !== undefined) { sets.push('reviews_enabled = ?'); params.push(reviews_enabled ? 1 : 0); }
    if (reviews_window_start !== undefined) { sets.push('reviews_window_start = ?'); params.push(reviews_window_start || null); }
    if (reviews_window_end !== undefined) { sets.push('reviews_window_end = ?'); params.push(reviews_window_end || null); }
    if (student_feedback_enabled !== undefined) { sets.push('student_feedback_enabled = ?'); params.push(student_feedback_enabled ? 1 : 0); }
    if (student_feedback_window_start !== undefined) { sets.push('student_feedback_window_start = ?'); params.push(student_feedback_window_start || null); }
    if (student_feedback_window_end !== undefined) { sets.push('student_feedback_window_end = ?'); params.push(student_feedback_window_end || null); }
    if (!sets.length) return res.status(400).json({ success: false, error: 'No fields to update' });

    params.push(id);
    const sql = `UPDATE courses SET ${sets.join(', ')} WHERE course_id = ?`;
    console.log(`Executing SQL: ${sql} with params:`, params);
    const result = await runAsync(sql, params);
    console.log(`Result object:`, result);
    console.log(`✓ Course ${id} updated: ${result.changes} row(s) affected`);
    res.json({ success: true, updated: result.changes });
  } catch (err) {
    console.error('Update course error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------
// Routes: Enrollments
// ---------------------------

// Add enrollment (Admin)
// Student enrolls in a course
app.post("/api/student/enroll", (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) {
    return res
      .status(400)
      .json({ success: false, error: "Student ID and Course ID are required" });
  }

  // Check if student exists
  db.get(
    `SELECT student_id, name FROM students WHERE student_id = ?`,
    [student_id],
    (err, student) => {
      if (err) {
        console.error("Student lookup error:", err.message);
        return res
          .status(500)
          .json({ success: false, error: "Database error" });
      }
      if (!student) {
        return res
          .status(400)
          .json({ success: false, error: "Student ID does not exist" });
      }
      // Check if course exists
      db.get(
        `SELECT course_id, course_name FROM courses WHERE course_id = ?`,
        [course_id],
        (err, course) => {
          if (err) {
            console.error("Course lookup error:", err.message);
            return res
              .status(500)
              .json({ success: false, error: "Database error" });
          }
          if (!course) {
            return res
              .status(400)
              .json({ success: false, error: "Course ID does not exist" });
          }
          // Check if already enrolled, then insert (only store ids; student/course names are queried when needed)
          db.get(
            `SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?`,
            [student.student_id, course.course_id],
            (err2, existing) => {
              if (err2) {
                console.error('Enrollment lookup error:', err2.message);
                return res.status(500).json({ success: false, error: 'Database error' });
              }
              if (existing) {
                return res.status(400).json({ success: false, error: 'Student is already enrolled in this course' });
              }

              db.run(
                `INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`,
                [student.student_id, course.course_id],
                function (err) {
                  if (err) {
                    console.error("❌ Add enrollment failed:", err.message);
                    return res.status(500).json({ success: false, error: err.message });
                  }
                  res.json({
                    success: true,
                    message: "Enrollment added successfully",
                    enrollment_id: this.lastID,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
// 🟢 Add Enrollment (auto-fill student/course names)
app.post("/api/admin/add-enrollment", async (req, res) => {
  const { student_id, course_id } = req.body;

  if (!student_id || !course_id) {
    return res
      .status(400)
      .json({ success: false, error: "Student ID and Course ID are required" });
  }

  try {
    // Check if student exists
    const student = await getAsync(
      `SELECT student_id FROM students WHERE student_id = ?`,
      [student_id]
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    // Check if course exists
    const course = await getAsync(
      `SELECT course_id FROM courses WHERE course_id = ?`,
      [course_id]
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Check if already enrolled
    const existing = await getAsync(
      `SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?`,
      [student_id, course_id]
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Student is already enrolled in this course",
      });
    }

    // Insert enrollment
    const result = await runAsync(
      `INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`,
      [student_id, course_id]
    );

    res.json({
      success: true,
      message: "Enrollment added successfully",
      enrollment_id: result.lastID,
    });
  } catch (err) {
    console.error("❌ Add enrollment failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// List enrollments (Admin)
app.get("/api/admin/enrollments", (req, res) => {
  const query = `
    SELECT 
      e.enrollment_id,
      e.student_id,
      s.name AS student_name,
      e.course_id,
      c.course_name,
      c.teacher_id,
      e.created_at
    FROM enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN courses c ON e.course_id = c.course_id
    ORDER BY e.enrollment_id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Failed to fetch enrollments:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, enrollments: rows });
  });
});

// Remove enrollment
app.delete("/api/admin/remove-enrollment/:id", (req, res) => {
  const id = req.params.id;
  db.run(
    `DELETE FROM enrollments WHERE enrollment_id = ?`,
    [id],
    function (err) {
      if (err) {
        console.error("Remove enrollment error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, deleted: this.changes });
    }
  );
});

// List enrollments for a student (used by student-facing UI)
app.get('/api/student/enrollments/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const q = `
      SELECT e.enrollment_id, e.student_id, e.course_id, c.course_name, c.schedule, c.duration, c.teacher_id, t.name AS teacher_name, e.created_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      WHERE e.student_id = ?
      ORDER BY c.course_id ASC
    `;
    const rows = await allAsync(q, [studentId]);
    res.json({ success: true, enrollments: rows });
  } catch (err) {
    console.error('Failed to fetch student enrollments:', err && err.message ? err.message : err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// ---------------------------
// Start server
// ---------------------------
// Start server (auto-seed sample quiz removed)
app.listen(PORT, () => {
  console.log(`🚀 Server listening: http://localhost:${PORT}`);
});

// Get teacher's courses (by teacher_id)
app.get("/api/teacher/courses/:teacherId", async (req, res) => {
  try {
    const courses = await allAsync(
      `SELECT course_id, course_name, description, teacher_id, reviews_enabled, reviews_window_start, reviews_window_end, created_at FROM courses WHERE teacher_id = ?`,
      [req.params.teacherId]
    );
    const norm = (v) => (v ? String(v).replace(' ', 'T') : v);
    const out = (courses || []).map(c => ({
      ...c,
      reviews_window_start: norm(c.reviews_window_start),
      reviews_window_end: norm(c.reviews_window_end)
    }));
    res.json({ success: true, courses: out });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: activate teacher reviews for all courses
app.post('/api/admin/reviews/activate-all', async (req, res) => {
  try {
    const { reviews_window_start, reviews_window_end } = req.body || {};
    const start = reviews_window_start || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const end = reviews_window_end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await runAsync('UPDATE courses SET reviews_enabled = 1, reviews_window_start = ?, reviews_window_end = ?', [start, end]);
    res.json({ success: true });
  } catch (err) {
    console.error('Activate all reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: close teacher reviews for all courses
app.post('/api/admin/reviews/close-all', async (req, res) => {
  try {
    await runAsync('UPDATE courses SET reviews_enabled = 0', []);
    res.json({ success: true });
  } catch (err) {
    console.error('Close all reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: activate student feedback for all courses
app.post('/api/admin/student-reviews/activate-all', async (req, res) => {
  try {
    const { student_feedback_window_start, student_feedback_window_end } = req.body || {};
    const start = student_feedback_window_start || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const end = student_feedback_window_end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await runAsync('UPDATE courses SET student_feedback_enabled = 1, student_feedback_window_start = ?, student_feedback_window_end = ?', [start, end]);
    res.json({ success: true });
  } catch (err) {
    console.error('Activate all student reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: close student feedback for all courses
app.post('/api/admin/student-reviews/close-all', async (req, res) => {
  try {
    await runAsync('UPDATE courses SET student_feedback_enabled = 0', []);
    res.json({ success: true });
  } catch (err) {
    console.error('Close all student reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Contact form support removed: endpoint intentionally disabled.
// POST /api/contact has been removed to delete contact-related storage.
// If front-end still posts to this route, it will receive a 404 response.

// Remove course (Teacher) - fix column names
app.delete("/api/teacher/remove-course/:id", (req, res) => {
  (async () => {
    const id = req.params.id;
    const teacherId = req.query.teacherId;
    const cascade = String(req.query.cascade || '').toLowerCase() === 'true' || req.query.cascade === '1';

    if (!teacherId) return res.status(400).json({ success: false, error: 'Missing teacherId query parameter' });

    try {
      // Verify the course belongs to this teacher
      const course = await getAsync('SELECT course_id FROM courses WHERE course_id = ? AND teacher_id = ?', [id, teacherId]);
      if (!course) return res.status(404).json({ success: false, error: 'Course not found for this teacher' });

      // Check dependencies
      const deps = await getAsync(
        `SELECT
           (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) AS enrollments_count,
           (SELECT COUNT(*) FROM assignments WHERE course_id = ?) AS assignments_count,
           (SELECT COUNT(*) FROM quizzes WHERE course_id = ?) AS quizzes_count,
           (SELECT COUNT(*) FROM attendance WHERE course_id = ?) AS attendance_count
         `,
        [id, id, id, id]
      );

      const blockers = [];
      if (deps && deps.enrollments_count && deps.enrollments_count > 0) blockers.push({ type: 'enrollments', count: deps.enrollments_count });
      if (deps && deps.assignments_count && deps.assignments_count > 0) blockers.push({ type: 'assignments', count: deps.assignments_count });
      if (deps && deps.quizzes_count && deps.quizzes_count > 0) blockers.push({ type: 'quizzes', count: deps.quizzes_count });
      if (deps && deps.attendance_count && deps.attendance_count > 0) blockers.push({ type: 'attendance', count: deps.attendance_count });

      if (blockers.length && !cascade) {
        return res.status(409).json({
          success: false,
          error: 'Course has dependent records and cannot be deleted',
          dependencies: blockers,
          hint: 'Remove dependent records first or retry with ?cascade=true to delete related data.'
        });
      }

      if (cascade) {
        try {
          await runAsync('BEGIN TRANSACTION');
          await runAsync('DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM assignments WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM quiz_responses WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM quiz_questions WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM quizzes WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM attendance WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM enrollments WHERE course_id = ?', [id]);
          const result = await runAsync('DELETE FROM courses WHERE course_id = ? AND teacher_id = ?', [id, teacherId]);
          await runAsync('COMMIT');
          return res.json({ success: true, deleted: result.changes });
        } catch (err) {
          console.error('Teacher cascade delete failed:', err && err.message ? err.message : err);
          try { await runAsync('ROLLBACK'); } catch (e) { }
          return res.status(500).json({ success: false, error: err.message || String(err) });
        }
      }

      // No blockers: safe to delete
      db.run('DELETE FROM courses WHERE course_id = ? AND teacher_id = ?', [id, teacherId], function (err) {
        if (err) {
          console.error('Teacher remove course error:', err.message);
          if (String(err.message).toLowerCase().includes('foreign key')) {
            return res.status(409).json({ success: false, error: 'Could not delete: dependent records exist', details: err.message });
          }
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, deleted: this.changes });
      });
    } catch (err) {
      console.error('Teacher remove course (check) error:', err && err.message ? err.message : err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  })();
});

// Get enrolled students for a course (include student info and course info)
app.get("/api/teacher/courses/:courseId/students", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const students = await allAsync(
      `SELECT s.student_id AS student_id, s.name, s.email, e.created_at AS enrolled_at
       FROM enrollments e
       JOIN students s ON e.student_id = s.student_id
       WHERE e.course_id = ?`,
      [courseId]
    );

    const course = await getAsync(
      `SELECT course_id, course_name, description, teacher_id FROM courses WHERE course_id = ?`,
      [courseId]
    );

    res.json({ success: true, course: course || null, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Teacher view: students with attendance counts for a course (convenience endpoint)
app.get('/api/teacher/course/:courseId/students', (req, res) => {
  const { courseId } = req.params;
  db.all(`
    SELECT s.student_id, s.name, s.email,
      (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.student_id AND a.course_id = ? AND a.status = 'present') as present_count,
      (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.student_id AND a.course_id = ? AND a.status = 'absent') as absent_count
    FROM students s
    JOIN enrollments e ON s.student_id = e.student_id
    WHERE e.course_id = ?
  `, [courseId, courseId, courseId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json(rows || []);
  });
});

// ---------------------------
// Routes: Attendance (teacher & student)
// ---------------------------

// Mark attendance (teacher)
app.post("/api/teacher/attendance", (req, res) => {
  const { courseId, attendance } = req.body; // attendance: [{ studentId, status, date }]
  if (!courseId || !Array.isArray(attendance)) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const stmt = db.prepare(`INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)`);
  let errored = false;
  attendance.forEach(rec => {
    stmt.run([rec.studentId, courseId, rec.date, rec.status], (err) => {
      if (err) errored = true;
    });
  });
  stmt.finalize((err) => {
    if (err || errored) return res.status(500).json({ success: false, error: 'Failed to save attendance' });
    res.json({ success: true });
  });
});

// Get student attendance summary
// Get student's attendance records - Using async/await for better error handling
app.get("/api/student/attendance/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate student exists
    const student = await getAsync('SELECT student_id FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const rows = await allAsync(`
      SELECT 
        c.course_id, 
        c.course_name,
        GROUP_CONCAT(DISTINCT a.date || ':' || a.status) as attendance_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(CASE WHEN COUNT(a.attendance_id) = 0 THEN 0 
              ELSE (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.attendance_id)) 
              END, 2) AS attendance_percentage
      FROM courses c
      JOIN enrollments e ON c.course_id = e.course_id AND e.student_id = ?
      LEFT JOIN attendance a ON c.course_id = a.course_id AND a.student_id = ?
      GROUP BY c.course_id, c.course_name
    `, [studentId, studentId]);

    // Parse attendance records string into array of objects
    const processedRows = rows.map(row => {
      const details = row.attendance_records ?
        row.attendance_records.split(',').map(record => {
          const [date, status] = record.split(':');
          return { date, status };
        }) : [];

      return {
        ...row,
        attendance_details: details
      };
    });

    res.json({ success: true, data: processedRows });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance records',
      details: err.message
    });
  }
});

// ---------------------------
// Routes: Quizzes
// ---------------------------

// Create quiz (teacher)
app.post("/api/teacher/quiz", (req, res) => {
  const { courseId, title, description, timeLimit, questions } = req.body;
  if (!courseId || !title || !Array.isArray(questions)) return res.status(400).json({ success: false, error: 'Missing fields' });

  db.run(`INSERT INTO quizzes (course_id, title, description, time_limit) VALUES (?, ?, ?, ?)`, [courseId, title, description || null, timeLimit || null], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const quizId = this.lastID;
    const stmt = db.prepare(`INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, points) VALUES (?, ?, ?, ?, ?)`);
    let failed = false;
    questions.forEach(q => {
      // Normalize correct answer to be a number (index of correct option)
      let correctAnswer = q.correctAnswer;
      if (typeof correctAnswer === 'string') {
        // If it's a letter (a, b, c...), convert to index (0, 1, 2...)
        if (correctAnswer.length === 1) {
          correctAnswer = correctAnswer.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        } else {
          // Find index of the answer text in options
          const options = Array.isArray(q.options) ? q.options : [];
          correctAnswer = options.findIndex(opt =>
            String(opt).toLowerCase() === correctAnswer.toLowerCase()
          );
          if (correctAnswer === -1) correctAnswer = 0; // Default to first option if not found
        }
      }
      // Always store as string representation of the index
      stmt.run([
        quizId,
        q.text,
        JSON.stringify(q.options),
        String(correctAnswer), // Store as string of the index
        q.points || 1
      ], (err) => { if (err) failed = true; });
    });
    stmt.finalize((sErr) => {
      if (sErr || failed) return res.status(500).json({ success: false, error: 'Failed to save questions' });
      res.json({ success: true, quizId });
    });
  });
});

// List quizzes for a course (teacher)
app.get('/api/teacher/quizzes/:courseId', (req, res) => {
  const { courseId } = req.params;
  db.all(`SELECT quiz_id, course_id, title, description, time_limit, is_active, created_at FROM quizzes WHERE course_id = ? ORDER BY created_at DESC`, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json(rows || []);
  });
});

// Toggle quiz active
app.post('/api/teacher/quiz/:quizId/toggle', (req, res) => {
  const { quizId } = req.params; const { isActive } = req.body;
  db.run('UPDATE quizzes SET is_active = ? WHERE quiz_id = ?', [isActive ? 1 : 0, quizId], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// Get quiz results (teacher view)
app.get('/api/teacher/quiz/:quizId/results', (req, res) => {
  const { quizId } = req.params;
  db.get(`SELECT COUNT(*) as totalParticipants, AVG(score) as averageScore FROM quiz_responses WHERE quiz_id = ?`, [quizId], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ totalParticipants: row.totalParticipants || 0, averageScore: row.averageScore || 0 });
  });
});

// Get student's available quizzes
app.get('/api/student/:studentId/quizzes', (req, res) => {
  const { studentId } = req.params;
  const query = `
    SELECT 
      q.quiz_id,
      q.title,
      q.description,
      q.time_limit,
      q.is_active,
      c.course_id,
      c.course_name,
      qr.score,
      qr.submitted_at,
      COUNT(qq.question_id) as total_questions,
      COALESCE(qr.score, 0) as student_score
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    JOIN quizzes q ON c.course_id = q.course_id
    LEFT JOIN quiz_questions qq ON q.quiz_id = qq.quiz_id
    LEFT JOIN quiz_responses qr ON q.quiz_id = qr.quiz_id AND qr.student_id = ?
    WHERE e.student_id = ?
    GROUP BY q.quiz_id
    ORDER BY q.created_at DESC
  `;

  db.all(query, [studentId, studentId], (err, quizzes) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, quizzes });
  });
});

// Debug endpoint to check quiz data
app.get('/api/debug/quiz/:quizId/full', (req, res) => {
  const { quizId } = req.params;
  db.serialize(() => {
    // Get quiz info
    db.get('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId], (err, quiz) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

      // Get questions with all details
      db.all(`
        SELECT 
          qq.question_id,
          qq.question_text,
          qq.options,
          qq.correct_answer,
          qq.points,
          (
            SELECT COUNT(*) 
            FROM quiz_responses qr 
            WHERE qr.quiz_id = ? AND json_extract(qr.answers, '$.' || qq.question_id) = qq.correct_answer
          ) as times_answered_correctly
        FROM quiz_questions qq
        WHERE qq.quiz_id = ?
      `, [quizId, quizId], (err, questions) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        // Process each question
        const processedQuestions = questions.map(q => ({
          ...q,
          options: (() => {
            try { return JSON.parse(q.options); }
            catch (e) { return q.options; }
          })(),
          correct_answer_raw: q.correct_answer,
          correct_answer_parsed: (() => {
            try { return JSON.parse(q.correct_answer); }
            catch (e) { return q.correct_answer; }
          })(),
        }));

        res.json({
          success: true,
          quiz,
          questions: processedQuestions,
          debug_note: 'Compare correct_answer_raw vs correct_answer_parsed to see storage format'
        });
      });
    });
  });
});

// List all quizzes with questions for debugging
app.get('/api/debug/quizzes', (req, res) => {
  db.all(`
    SELECT 
      q.quiz_id,
      q.title,
      q.is_active,
      COUNT(qq.question_id) as question_count,
      GROUP_CONCAT(qq.correct_answer) as answer_formats
    FROM quizzes q
    LEFT JOIN quiz_questions qq ON q.quiz_id = qq.quiz_id
    GROUP BY q.quiz_id
  `, [], (err, quizzes) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, quizzes });
  });
});

// Original debug endpoint
app.get('/api/debug/quiz/:quizId', (req, res) => {
  const { quizId } = req.params;
  db.all(
    'SELECT question_id, question_text, options, correct_answer FROM quiz_questions WHERE quiz_id = ?',
    [quizId],
    (err, questions) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true, questions: questions.map(q => ({
          ...q,
          options: JSON.parse(q.options || '[]'),
          correct_answer: q.correct_answer,
          correct_answer_parsed: (() => {
            try { return JSON.parse(q.correct_answer); }
            catch (e) { return q.correct_answer; }
          })()
        }))
      });
    }
  );
});

// Get quiz questions (student takes quiz)
app.get('/api/student/quiz/:quizId/questions', (req, res) => {
  const { quizId } = req.params;
  db.get('SELECT quiz_id, title, time_limit FROM quizzes WHERE quiz_id = ? AND is_active = 1', [quizId], (err, quiz) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found or not active' });

    db.all('SELECT question_id, question_text, options FROM quiz_questions WHERE quiz_id = ?', [quizId], (qErr, questions) => {
      if (qErr) return res.status(500).json({ success: false, error: qErr.message });
      res.json({
        success: true,
        quiz: {
          quizId: quiz.quiz_id,
          title: quiz.title,
          timeLimit: quiz.time_limit,
          questions: questions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
          }))
        }
      });
    });
  });
});

// Submit quiz (student)

// Submit quiz (student)
app.post('/api/student/quiz/:quizId/submit', (req, res) => {
  const { quizId } = req.params;
  const studentId = req.body.studentId || req.body.student_id;
  const answers = req.body.answers;
  if (!studentId || !answers) return res.status(400).json({ success: false, error: 'Missing fields: studentId and answers are required' });

  console.log('Quiz submit received:', { quizId, studentId, answersCount: (answers && typeof answers === 'object') ? Object.keys(answers).length : 0 });

  db.all('SELECT question_id, correct_answer, points, options FROM quiz_questions WHERE quiz_id = ?', [quizId], (err, questions) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    let score = 0;

    questions.forEach(q => {
      try {
        const given = answers[q.question_id];
        if (given == null) return; // no answer provided

        // Parse options safely
        let questionOptions = [];
        try {
          questionOptions = JSON.parse(q.options || '[]');
        } catch (e) {
          console.error(`Failed to parse options for question ${q.question_id}:`, e);
          return; // skip this question
        }

        // Normalize student answer to index (robust: accept index, letter, or option text)
        let studentIndex = null;
        try {
          const rawGiven = given;
          const numGiven = Number(rawGiven);
          if (!isNaN(numGiven) && Number.isFinite(numGiven) && numGiven >= 0 && numGiven < questionOptions.length) {
            studentIndex = numGiven;
          } else if (typeof rawGiven === 'string' && /^[a-zA-Z]$/.test(rawGiven)) {
            studentIndex = rawGiven.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
          } else {
            // match by option text
            studentIndex = questionOptions.findIndex(opt => String(opt).trim().toLowerCase() === String(rawGiven).trim().toLowerCase());
            if (studentIndex === -1) studentIndex = null;
          }
        } catch (e) {
          studentIndex = null;
        }

        // Determine correct answer index robustly
        let correctIndex = null;
        try {
          let ca = q.correct_answer;
          // If stored as JSON (e.g., "1" or ["1"]), try parsing
          if (typeof ca === 'string') {
            try {
              const parsed = JSON.parse(ca);
              if (typeof parsed === 'number' || typeof parsed === 'string') ca = parsed;
              else if (Array.isArray(parsed) && parsed.length > 0) ca = parsed[0];
            } catch (e) {
              // not JSON, keep as-is
            }
          }

          const numCa = Number(ca);
          if (!isNaN(numCa) && Number.isFinite(numCa) && numCa >= 0 && numCa < questionOptions.length) {
            correctIndex = numCa;
          } else if (typeof ca === 'string' && /^[a-zA-Z]$/.test(ca)) {
            correctIndex = ca.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
          } else {
            correctIndex = questionOptions.findIndex(opt => String(opt).trim().toLowerCase() === String(ca).trim().toLowerCase());
            if (correctIndex === -1) correctIndex = null;
          }
        } catch (e) {
          correctIndex = null;
        }

        console.log(`Question ${q.question_id} comparison:`, { studentIndex, correctIndex, studentGiven: given });

        if (studentIndex !== null && correctIndex !== null && studentIndex === correctIndex) {
          score += (q.points != null ? Number(q.points) : 1) || 1;
          console.log(`Question ${q.question_id}: CORRECT`);
        } else {
          console.log(`Question ${q.question_id}: WRONG (expected ${correctIndex} got ${studentIndex})`);
        }

      } catch (e) {
        console.error(`Error processing question ${q.question_id}:`, e);
      }
    });

    // Store the response
    db.run('INSERT INTO quiz_responses (quiz_id, student_id, answers, score) VALUES (?, ?, ?, ?)', [quizId, studentId, JSON.stringify(answers), score], function (iErr) {
      if (iErr) {
        console.error('Failed to save quiz response:', iErr);
        return res.status(500).json({ success: false, error: iErr.message });
      }
      return res.json({ success: true, score });
    });
  });
});

// ---------------------------
// Routes: Assignments
// ---------------------------

// Create assignment
app.post('/api/teacher/assignment', (req, res) => {
  const { courseId, title, description, link, dueDate } = req.body;
  if (!courseId || !title) return res.status(400).json({ success: false, error: 'Missing fields' });
  db.run('INSERT INTO assignments (course_id, title, description, link, due_date) VALUES (?, ?, ?, ?, ?)', [courseId, title, description || null, link || null, dueDate || null], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, assignmentId: this.lastID });
  });
});

// Get assignments for a course (students/teachers)
app.get('/api/course/:courseId/assignments', (req, res) => {
  const { courseId } = req.params;
  const studentId = req.query.studentId; // Optional student ID to get submission status

  const query = `
    SELECT 
      a.assignment_id, 
      a.course_id, 
      a.title, 
      a.description, 
      a.link, 
      a.due_date, 
      a.created_at,
      c.course_name,
      COALESCE(s.marks, -1) as student_marks,
      s.submitted_at as submission_date
    FROM assignments a
    JOIN courses c ON a.course_id = c.course_id
    LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id 
      AND s.student_id = COALESCE(?, -1)
    WHERE a.course_id = ?
    ORDER BY a.due_date ASC
  `;

  db.all(query, [studentId, courseId], (err, assignments) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, assignments });
  });
});

// Get all assignments for a student
app.get('/api/student/:studentId/assignments', (req, res) => {
  const { studentId } = req.params;

  const query = `
    SELECT 
      a.assignment_id, 
      a.title, 
      a.description, 
      a.link, 
      a.due_date, 
      a.created_at,
      c.course_id,
      c.course_name,
      COALESCE(s.marks, -1) as marks,
      s.submitted_at as submission_date,
      CASE 
        WHEN s.submitted_at IS NOT NULL THEN 'submitted'
        WHEN date('now') > date(a.due_date) THEN 'overdue'
        ELSE 'pending'
      END as status
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    JOIN assignments a ON c.course_id = a.course_id
    LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ?
    WHERE e.student_id = ?
    ORDER BY a.due_date ASC
  `;

  db.all(query, [studentId, studentId], (err, assignments) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, assignments });
  });
});

// Teacher sets marks for a student's assignment submission
app.post('/api/teacher/assignment/:assignmentId/marks', (req, res) => {
  const { assignmentId } = req.params; const { studentId, marks } = req.body;
  if (!studentId) return res.status(400).json({ success: false, error: 'Missing studentId' });
  db.run('INSERT OR REPLACE INTO assignment_submissions (assignment_id, student_id, marks) VALUES (?, ?, ?)', [assignmentId, studentId, marks || null], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// Get enrolled students for assignment with any existing marks (for grading UI)
app.get('/api/teacher/assignment/:assignmentId/submissions', (req, res) => {
  const { assignmentId } = req.params;
  const sql = `
    SELECT st.student_id, st.name, subs.marks
    FROM enrollments en
    JOIN students st ON en.student_id = st.student_id
    LEFT JOIN assignment_submissions subs ON subs.assignment_id = ? AND subs.student_id = st.student_id
    WHERE en.course_id = (
      SELECT course_id FROM assignments WHERE assignment_id = ?
    )
    ORDER BY st.name
  `;
  db.all(sql, [assignmentId, assignmentId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, students: rows || [] });
  });
});

// Teacher deletes a quiz (and its related questions & responses)
app.delete('/api/teacher/quiz/:quizId', async (req, res) => {
  const { quizId } = req.params;
  try {
    await runAsync('BEGIN TRANSACTION');
    await runAsync('DELETE FROM quiz_responses WHERE quiz_id = ?', [quizId]);
    await runAsync('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId]);
    const result = await runAsync('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);
    await runAsync('COMMIT');
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Delete quiz error:', err.message);
    try { await runAsync('ROLLBACK'); } catch (e) { }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all marks (mid, final, quizzes, assignments) for a course
app.get('/api/teacher/course/:courseId/marks', async (req, res) => {
  const { courseId } = req.params;
  try {
    // Get enrolled students with their grades
    const sql = `
      SELECT 
        s.student_id, 
        s.name,
        g.quiz_marks,
        g.assignment_marks,
        g.mid_marks,
        g.final_marks,
        g.total_marks,
        g.grade
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN student_grades g ON g.student_id = s.student_id AND g.course_id = ?
      WHERE e.course_id = ?
      ORDER BY s.name
    `;

    const students = await allAsync(sql, [courseId, courseId]);
    res.json({ success: true, students });
  } catch (err) {
    console.error('Get course marks error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update mid/final marks for a student in a course
app.post('/api/teacher/course/:courseId/marks', async (req, res) => {
  const { courseId } = req.params;
  const { studentId, midMarks, finalMarks } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'Missing studentId' });
  }

  // Validate mark ranges
  if (midMarks && (midMarks < 0 || midMarks > 30)) {
    return res.status(400).json({ success: false, error: 'Mid marks must be between 0 and 30' });
  }
  if (finalMarks && (finalMarks < 0 || finalMarks > 40)) {
    return res.status(400).json({ success: false, error: 'Final marks must be between 0 and 40' });
  }

  try {
    const sql = `
      INSERT INTO mid_final_marks (student_id, course_id, mid_marks, final_marks)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id, course_id) DO UPDATE SET
      mid_marks = COALESCE(excluded.mid_marks, mid_marks),
      final_marks = COALESCE(excluded.final_marks, final_marks),
      updated_at = CURRENT_TIMESTAMP
      ON CONFLICT(student_id, course_id) DO UPDATE SET
      mid_marks = COALESCE(excluded.mid_marks, mid_marks),
      final_marks = COALESCE(excluded.final_marks, final_marks)
    `;

    await runAsync(sql, [studentId, courseId, midMarks || null, finalMarks || null]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update marks error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get quizzes and marks for a student in a course
app.get('/api/teacher/course/:courseId/student/:studentId/quizzes', async (req, res) => {
  const { courseId, studentId } = req.params;
  try {
    const sql = `
      SELECT 
        q.quiz_id,
        q.title,
        (SELECT SUM(qr.marks) 
         FROM quiz_responses qr 
         JOIN quiz_questions qq ON qr.question_id = qq.question_id 
         WHERE qq.quiz_id = q.quiz_id AND qr.student_id = ?) as marks
      FROM quizzes q
      WHERE q.course_id = ?
      ORDER BY q.created_at DESC
    `;
    const quizzes = await allAsync(sql, [studentId, courseId]);
    res.json({ success: true, quizzes });
  } catch (err) {
    console.error('Get student quizzes error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get assignments and marks for a student in a course
app.get('/api/teacher/course/:courseId/student/:studentId/assignments', async (req, res) => {
  const { courseId, studentId } = req.params;
  try {
    const sql = `
      SELECT 
        a.assignment_id,
        a.title,
        asub.marks
      FROM assignments a
      LEFT JOIN assignment_submissions asub 
        ON a.assignment_id = asub.assignment_id 
        AND asub.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.due_date DESC
    `;
    const assignments = await allAsync(sql, [studentId, courseId]);
    res.json({ success: true, assignments });
  } catch (err) {
    console.error('Get student assignments error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Teacher deletes an assignment (and its submissions)
app.delete('/api/teacher/assignment/:assignmentId', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    await runAsync('BEGIN TRANSACTION');
    await runAsync('DELETE FROM assignment_submissions WHERE assignment_id = ?', [assignmentId]);
    const result = await runAsync('DELETE FROM assignments WHERE assignment_id = ?', [assignmentId]);
    await runAsync('COMMIT');
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Delete assignment error:', err.message);
    try { await runAsync('ROLLBACK'); } catch (e) { }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save student grade
app.post('/api/teacher/student/grade', async (req, res) => {
  const { studentId, courseId, quizMarks, assignmentMarks, midMarks, finalMarks, totalMarks, grade } = req.body;

  if (!studentId || !courseId || !grade) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const sql = `
      INSERT INTO student_grades (
        student_id, course_id, quiz_marks, assignment_marks, 
        mid_marks, final_marks, total_marks, grade, cgpa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, course_id) DO UPDATE SET
        quiz_marks = excluded.quiz_marks,
        assignment_marks = excluded.assignment_marks,
        mid_marks = excluded.mid_marks,
        final_marks = excluded.final_marks,
        total_marks = excluded.total_marks,
        grade = excluded.grade,
        cgpa = excluded.cgpa,
        created_at = CURRENT_TIMESTAMP
    `;

    await runAsync(sql, [
      studentId, courseId, quizMarks, assignmentMarks,
      midMarks, finalMarks, totalMarks, grade, req.body.cgpa || null
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Save grade error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get transcript for a student (enrollments + saved grades)
app.get('/api/student/transcript/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const sql = `
      SELECT c.course_id, c.course_name AS name,
             COALESCE(g.total_marks, NULL) AS total_marks,
             COALESCE(g.grade, NULL) AS grade,
             COALESCE(g.cgpa, NULL) AS cgpa
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN student_grades g ON g.student_id = ? AND g.course_id = e.course_id
      WHERE e.student_id = ?
      ORDER BY c.course_name
    `;

    const rows = await allAsync(sql, [studentId, studentId]);
    res.json({ success: true, transcript: rows });
  } catch (err) {
    console.error('Get transcript error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Teacher updates attendance for a specific course and date.
// Body: { courseId, date: 'YYYY-MM-DD', studentId (optional), status: 'present'|'absent' }
// Accept POST batch from existing UI: { courseId, attendance: [ { studentId, status, date } ] }
app.post('/api/teacher/attendance', async (req, res) => {
  const { courseId, attendance } = req.body;
  if (!courseId || !Array.isArray(attendance)) return res.status(400).json({ success: false, error: 'Missing fields: courseId and attendance array are required' });
  try {
    await runAsync('BEGIN TRANSACTION');
    for (const rec of attendance) {
      const studentId = rec.studentId || rec.student_id;
      const date = rec.date;
      const status = rec.status;
      if (!studentId || !date || !['present', 'absent'].includes(status)) continue; // skip invalid
      const existing = await getAsync('SELECT attendance_id FROM attendance WHERE course_id = ? AND student_id = ? AND date = ?', [courseId, studentId, date]);
      if (existing) {
        await runAsync('UPDATE attendance SET status = ? WHERE attendance_id = ?', [status, existing.attendance_id]);
      } else {
        await runAsync('INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)', [studentId, courseId, date, status]);
      }
    }
    await runAsync('COMMIT');
    res.json({ success: true });
  } catch (err) {
    console.error('Batch update attendance error:', err.message);
    try { await runAsync('ROLLBACK'); } catch (e) { }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep PATCH for single/all usage (backwards compatible)
app.patch('/api/teacher/attendance', async (req, res) => {
  const { courseId, date, studentId, status } = req.body;
  if (!courseId || !date || !status) return res.status(400).json({ success: false, error: 'Missing fields: courseId, date and status are required' });
  if (!['present', 'absent'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });

  try {
    if (studentId) {
      const existing = await getAsync('SELECT attendance_id FROM attendance WHERE course_id = ? AND student_id = ? AND date = ?', [courseId, studentId, date]);
      if (existing) {
        await runAsync('UPDATE attendance SET status = ? WHERE attendance_id = ?', [status, existing.attendance_id]);
      } else {
        await runAsync('INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)', [studentId, courseId, date, status]);
      }
      return res.json({ success: true });
    }

    const students = await allAsync('SELECT student_id FROM enrollments WHERE course_id = ?', [courseId]);
    await runAsync('BEGIN TRANSACTION');
    for (const s of students) {
      const existing = await getAsync('SELECT attendance_id FROM attendance WHERE course_id = ? AND student_id = ? AND date = ?', [courseId, s.student_id, date]);
      if (existing) {
        await runAsync('UPDATE attendance SET status = ? WHERE attendance_id = ?', [status, existing.attendance_id]);
      } else {
        await runAsync('INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)', [s.student_id, courseId, date, status]);
      }
    }
    await runAsync('COMMIT');
    res.json({ success: true });
  } catch (err) {
    console.error('Update attendance error:', err.message);
    try { await runAsync('ROLLBACK'); } catch (e) { }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Student submits an assignment
app.post('/api/student/assignment/:assignmentId/submit', async (req, res) => {
  const { assignmentId } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'Missing studentId' });
  }

  try {
    // Check if assignment exists and is not past due date
    const assignment = await getAsync(
      'SELECT due_date FROM assignments WHERE assignment_id = ?',
      [assignmentId]
    );

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
      return res.status(400).json({ success: false, error: 'Assignment is past due date' });
    }

    // Check if already submitted
    const existing = await getAsync(
      'SELECT submission_id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );

    if (existing) {
      return res.status(400).json({ success: false, error: 'Assignment already submitted' });
    }

    // Submit the assignment
    await runAsync(
      'INSERT INTO assignment_submissions (assignment_id, student_id, submitted_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [assignmentId, studentId]
    );

    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (err) {
    console.error('Error submitting assignment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------
// Routes: Instructor Performance Reports
// ---------------------------

// Submit a performance report for an instructor (students or admins can submit)
app.post('/api/instructor/report', async (req, res) => {
  try {
    const { teacher_id, rating, comments, period_start, period_end } = req.body;
    if (!teacher_id || !rating) return res.status(400).json({ success: false, error: 'Missing fields' });
    const result = await runAsync(`INSERT INTO instructor_performance (teacher_id, period_start, period_end, rating, comments) VALUES (?, ?, ?, ?, ?)`, [teacher_id, period_start || null, period_end || null, rating, comments || null]);
    res.json({ success: true, report_id: result.lastID });
  } catch (err) {
    console.error('Submit instructor report error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get instructor reports and aggregated metrics
app.get('/api/instructor/reports/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const reports = await allAsync(`SELECT report_id, teacher_id, period_start, period_end, rating, comments, created_at FROM instructor_performance WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 100`, [teacherId]);
    const agg = await getAsync(`SELECT COUNT(*) as count, AVG(rating) as avg_rating, MIN(rating) as min_rating, MAX(rating) as max_rating FROM instructor_performance WHERE teacher_id = ?`, [teacherId]);
    res.json({ success: true, reports, aggregate: agg });
  } catch (err) {
    console.error('Get instructor reports error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------
// Routes: Internal Messaging
// ---------------------------

// Send a message
app.post('/api/messages', async (req, res) => {
  try {
    const { sender_id, receiver_id, content, subject, sender_type } = req.body;
    if (!sender_id || !receiver_id || !content) return res.status(400).json({ success: false, error: 'Missing fields' });

    // Resolve key and display name for sender and receiver. Prefer explicit sender_type if provided,
    // otherwise infer by checking teachers table first.
    async function resolveKeyAndName(id, hintType) {
      if (hintType === 'teacher') {
        const t = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [id]).catch(() => null);
        if (t && t.name) return { key: `T:${id}`, name: t.name };
      }
      if (hintType === 'student') {
        const s = await getAsync('SELECT name FROM students WHERE student_id = ?', [id]).catch(() => null);
        if (s && s.name) return { key: `S:${id}`, name: s.name };
      }
      // prefer teacher when ambiguous
      const t2 = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [id]).catch(() => null);
      if (t2 && t2.name) return { key: `T:${id}`, name: t2.name };
      const s2 = await getAsync('SELECT name FROM students WHERE student_id = ?', [id]).catch(() => null);
      if (s2 && s2.name) return { key: `S:${id}`, name: s2.name };
      return { key: `U:${id}`, name: null };
    }

    const senderResolved = await resolveKeyAndName(sender_id, sender_type);
    const receiverResolved = await resolveKeyAndName(receiver_id, null);

    const result = await runAsync(`INSERT INTO messages (sender_id, receiver_id, sender_key, receiver_key, sender_name, receiver_name, subject, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [sender_id, receiver_id, senderResolved.key, receiverResolved.key, senderResolved.name, receiverResolved.name, subject || 'No Subject', content]);
    res.json({ success: true, message_id: result.lastID });
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get inbox for a user (messages where they are receiver) - MUST come before generic :userId route
app.get('/api/messages/inbox/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const msgs = await allAsync(`SELECT * FROM messages WHERE receiver_id = ? ORDER BY created_at DESC`, [userId]);
    res.json(msgs || []);
  } catch (err) {
    console.error('Get inbox error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get sent messages for a user (messages where they are sender) - MUST come before generic :userId route
app.get('/api/messages/sent/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const msgs = await allAsync(`SELECT * FROM messages WHERE sender_id = ? ORDER BY created_at DESC`, [userId]);
    res.json(msgs || []);
  } catch (err) {
    console.error('Get sent error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get messages for a user (sent or received) - Generic route, must come AFTER specific inbox/sent routes
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const roleQuery = (req.query.role || '').toLowerCase();

    // Determine caller role if possible: honor explicit role param, otherwise infer
    async function inferRole(id) {
      const t = await getAsync('SELECT 1 FROM teachers WHERE teacher_id = ?', [id]).catch(() => null);
      const s = await getAsync('SELECT 1 FROM students WHERE student_id = ?', [id]).catch(() => null);
      if (roleQuery === 'teacher') return 'teacher';
      if (roleQuery === 'student') return 'student';
      if (t && !s) return 'teacher';
      if (s && !t) return 'student';
      return null; // ambiguous
    }

    const callerRole = await inferRole(userId);
    if (!callerRole) {
      return res.status(400).json({ success: false, error: 'Ambiguous user id. Include ?role=student or ?role=teacher in request.' });
    }
    const callerKey = (callerRole === 'teacher' ? `T:${userId}` : `S:${userId}`);

    // Fetch only messages where the canonical stored keys match the caller (ensures only the intended account sees messages)
    const msgs = await allAsync(`SELECT * FROM messages WHERE sender_key = ? OR receiver_key = ? ORDER BY created_at DESC`, [callerKey, callerKey]);

    // Ensure cached names present; if not, try to resolve (best effort)
    for (let msg of msgs) {
      if (!msg.sender_name) {
        const t = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [msg.sender_id]).catch(() => null);
        if (t && t.name) msg.sender_name = t.name;
        else {
          const s = await getAsync('SELECT name FROM students WHERE student_id = ?', [msg.sender_id]).catch(() => null);
          if (s && s.name) msg.sender_name = s.name;
        }
      }
      if (!msg.receiver_name) {
        const t2 = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [msg.receiver_id]).catch(() => null);
        if (t2 && t2.name) msg.receiver_name = t2.name;
        else {
          const s2 = await getAsync('SELECT name FROM students WHERE student_id = ?', [msg.receiver_id]).catch(() => null);
          if (s2 && s2.name) msg.receiver_name = s2.name;
        }
      }
      // Compute authoritative display names based on stored keys when available.
      // This ensures the client always sees the true sender's name even if older rows have ambiguous numeric ids.
      msg.display_sender_name = msg.sender_name || null;
      msg.display_receiver_name = msg.receiver_name || null;
      try {
        if (msg.sender_key) {
          const parts = String(msg.sender_key).split(':');
          if (parts[0] === 'T' && parts[1]) {
            const t = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [parts[1]]).catch(() => null);
            if (t && t.name) msg.display_sender_name = t.name;
          } else if (parts[0] === 'S' && parts[1]) {
            const s = await getAsync('SELECT name FROM students WHERE student_id = ?', [parts[1]]).catch(() => null);
            if (s && s.name) msg.display_sender_name = s.name;
          }
        }
        if (msg.receiver_key) {
          const partsR = String(msg.receiver_key).split(':');
          if (partsR[0] === 'T' && partsR[1]) {
            const t2 = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [partsR[1]]).catch(() => null);
            if (t2 && t2.name) msg.display_receiver_name = t2.name;
          } else if (partsR[0] === 'S' && partsR[1]) {
            const s2 = await getAsync('SELECT name FROM students WHERE student_id = ?', [partsR[1]]).catch(() => null);
            if (s2 && s2.name) msg.display_receiver_name = s2.name;
          }
        }
      } catch (e) {
        // ignore lookup errors and leave display names as resolved above
      }
    }

    res.json({ success: true, messages: msgs });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark message as read
app.put('/api/messages/:messageId/read', async (req, res) => {
  try {
    const id = req.params.messageId;
    const result = await runAsync('UPDATE messages SET is_read = 1 WHERE message_id = ?', [id]);
    res.json({ success: true, updated: result.changes });
  } catch (err) {
    console.error('Mark message read error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark multiple messages as read (batch operation)
app.post('/api/messages/mark-read-batch', async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, error: 'messageIds must be a non-empty array' });
    }
    const placeholders = messageIds.map(() => '?').join(',');
    const result = await runAsync(`UPDATE messages SET is_read = 1 WHERE message_id IN (${placeholders})`, messageIds);
    res.json({ success: true, updated: result.changes });
  } catch (err) {
    console.error('Mark messages read batch error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await runAsync('DELETE FROM messages WHERE message_id = ?', [id]);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Delete message error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single message by message_id
app.get('/api/messages/view/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const msg = await getAsync('SELECT * FROM messages WHERE message_id = ?', [messageId]);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json(msg);
  } catch (err) {
    console.error('Get single message error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Conversations summary for a user (other participant, unread count, last message info)
app.get('/api/messages/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const roleQuery = (req.query.role || '').toLowerCase();

    async function inferRole(id) {
      const t = await getAsync('SELECT 1 FROM teachers WHERE teacher_id = ?', [id]).catch(() => null);
      const s = await getAsync('SELECT 1 FROM students WHERE student_id = ?', [id]).catch(() => null);
      if (roleQuery === 'teacher') return 'teacher';
      if (roleQuery === 'student') return 'student';
      if (t && !s) return 'teacher';
      if (s && !t) return 'student';
      return null;
    }

    const callerRole = await inferRole(userId);
    if (!callerRole) return res.status(400).json({ success: false, error: 'Ambiguous user id. Include ?role=student or ?role=teacher in request.' });
    const callerKey = (callerRole === 'teacher' ? `T:${userId}` : `S:${userId}`);

    // Group by other participant key (the stored key ensures we match the exact account that participated in the message)
    const rows = await allAsync(
      `SELECT CASE WHEN sender_key = ? THEN receiver_key ELSE sender_key END AS other_key,
              SUM(CASE WHEN receiver_key = ? AND is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
              MAX(created_at) AS last_at
       FROM messages
       WHERE sender_key = ? OR receiver_key = ?
       GROUP BY other_key
       ORDER BY last_at DESC`,
      [callerKey, callerKey, callerKey, callerKey]
    );

    const convs = [];
    for (const r of rows) {
      const otherKey = r.other_key;
      const otherParts = String(otherKey || '').split(':');
      const otherType = otherParts[0] || 'U';
      const otherId = otherParts[1] || null;

      // Fetch last message between these exact keys
      const last = await getAsync(`SELECT * FROM messages WHERE (sender_key = ? AND receiver_key = ?) OR (sender_key = ? AND receiver_key = ?) ORDER BY created_at DESC LIMIT 1`, [callerKey, otherKey, otherKey, callerKey]);

      // Resolve display name for other participant: prefer cached values from last message if present
      let otherName = null;
      if (last && last.sender_key && last.receiver_key) {
        if (String(last.sender_key) === String(otherKey) && last.sender_name) otherName = last.sender_name;
        if (String(last.receiver_key) === String(otherKey) && last.receiver_name) otherName = last.receiver_name;
      }
      if (!otherName && otherType === 'T' && otherId) {
        const t = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [otherId]).catch(() => null);
        if (t && t.name) otherName = t.name;
      }
      if (!otherName && otherType === 'S' && otherId) {
        const s = await getAsync('SELECT name FROM students WHERE student_id = ?', [otherId]).catch(() => null);
        if (s && s.name) otherName = s.name;
      }
      if (!otherName) otherName = String(otherKey || otherId || 'Unknown');

      // attach last message with cached sender_name/receiver_name where available
      let lastMsgOut = null;
      if (last) {
        if (!last.sender_name) {
          const t1 = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [last.sender_id]).catch(() => null);
          if (t1 && t1.name) last.sender_name = t1.name;
          else {
            const s1 = await getAsync('SELECT name FROM students WHERE student_id = ?', [last.sender_id]).catch(() => null);
            if (s1 && s1.name) last.sender_name = s1.name;
          }
        }
        if (!last.receiver_name) {
          const t2 = await getAsync('SELECT name FROM teachers WHERE teacher_id = ?', [last.receiver_id]).catch(() => null);
          if (t2 && t2.name) last.receiver_name = t2.name;
          else {
            const s2 = await getAsync('SELECT name FROM students WHERE student_id = ?', [last.receiver_id]).catch(() => null);
            if (s2 && s2.name) last.receiver_name = s2.name;
          }
        }
        lastMsgOut = last;
      }

      convs.push({ other_key: otherKey, other_id: otherId, other_name: otherName, unread_count: r.unread_count || 0, last_at: r.last_at, last_message: lastMsgOut });
    }

    res.json({ success: true, conversations: convs });
  } catch (err) {
    console.error('Conversations error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Schedule: list of courses with schedule, duration and teacher name
app.get('/api/schedule', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT c.course_id, c.course_name, c.schedule, c.duration, c.teacher_id, t.name AS teacher_name FROM courses c LEFT JOIN teachers t ON c.teacher_id = t.teacher_id ORDER BY c.course_name`);
    res.json({ success: true, schedule: rows });
  } catch (err) {
    console.error('Schedule error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payment Gateway Enrollment (after payment is processed)
app.post('/api/enroll', async (req, res) => {
  try {
    const { studentId, courseId, paymentMethod, amount } = req.body;

    if (!studentId || !courseId || !paymentMethod || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if student exists
    const student = await getAsync('SELECT student_id FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(400).json({ success: false, error: 'Student not found' });
    }

    // Check if course exists
    const course = await getAsync('SELECT course_id FROM courses WHERE course_id = ?', [courseId]);
    if (!course) {
      return res.status(400).json({ success: false, error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await getAsync('SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }

    // Create enrollment record
    const result = await runAsync(
      'INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [studentId, courseId]
    );

    res.json({ success: true, enrollmentId: result.lastID, message: 'Enrollment successful!' });
  } catch (err) {
    console.error('Enrollment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create enrollment request (when student clicks enroll now)
app.post('/api/enrollment-request', async (req, res) => {
  try {
    const { studentId, courseId, studentName, courseName } = req.body;

    if (!studentId || !courseId || !studentName || !courseName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get student email
    const student = await getAsync('SELECT email FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(400).json({ success: false, error: 'Student not found' });
    }

    // Check if course exists
    const course = await getAsync('SELECT course_name FROM courses WHERE course_id = ?', [courseId]);
    if (!course) {
      return res.status(400).json({ success: false, error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await getAsync('SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }

    // Check if request already pending
    const pendingRequest = await getAsync('SELECT request_id FROM enrollment_requests WHERE student_id = ? AND course_id = ? AND status = ?', [studentId, courseId, 'pending']);
    if (pendingRequest) {
      return res.status(400).json({ success: false, error: 'Enrollment request already pending' });
    }

    // Generate fee challan number
    const challanNumber = `LEARN-${Date.now()}-${studentId}`;
    const feeAmount = 500;

    // Create enrollment request
    const result = await runAsync(
      'INSERT INTO enrollment_requests (student_id, course_id, student_name, student_email, course_name, fee_amount, challan_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, courseId, studentName, student.email, course.course_name, feeAmount, challanNumber]
    );

    // Create fee challan
    await runAsync(
      'INSERT INTO fee_challans (request_id, challan_number, student_name, course_name, amount) VALUES (?, ?, ?, ?, ?)',
      [result.lastID, challanNumber, studentName, course.course_name, feeAmount]
    );

    res.json({
      success: true,
      requestId: result.lastID,
      challanNumber: challanNumber,
      studentName: studentName,
      courseName: course.course_name,
      amount: feeAmount,
      message: 'Fee challan generated successfully!'
    });
  } catch (err) {
    console.error('Enrollment request error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get pending enrollment requests (for admin)
app.get('/api/admin/enrollment-requests', async (req, res) => {
  try {
    const rows = await allAsync(`
      SELECT r.*, c.course_name 
      FROM enrollment_requests r 
      JOIN courses c ON r.course_id = c.course_id 
      WHERE r.status = 'pending' 
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error('Get enrollment requests error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all contact us queries
app.get('/api/contact-us', async (req, res) => {
  try {
    const contacts = await allAsync(`SELECT * FROM contact_us ORDER BY contact_id DESC`);
    res.json(contacts || []);
  } catch (err) {
    console.error('Get contact us queries error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve enrollment request (admin)
app.post('/api/admin/enrollment-request/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get enrollment request
    const request = await getAsync('SELECT * FROM enrollment_requests WHERE request_id = ?', [requestId]);
    if (!request) {
      return res.status(400).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request already processed' });
    }

    // Create enrollment record
    await runAsync(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [request.student_id, request.course_id]
    );

    // Update enrollment request status and approved timestamp (do not generate or store credentials)
    await runAsync(
      'UPDATE enrollment_requests SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE request_id = ?',
      ['approved', requestId]
    );

    // Update fee challan status
    await runAsync(
      'UPDATE fee_challans SET status = ? WHERE request_id = ?',
      ['paid', requestId]
    );

    res.json({
      success: true,
      message: 'Enrollment approved!',
      studentEmail: request.student_email
    });
  } catch (err) {
    console.error('Approve enrollment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject enrollment request (admin)
app.post('/api/admin/enrollment-request/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get enrollment request
    const request = await getAsync('SELECT * FROM enrollment_requests WHERE request_id = ?', [requestId]);
    if (!request) {
      return res.status(400).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request already processed' });
    }

    // Update enrollment request
    await runAsync(
      'UPDATE enrollment_requests SET status = ? WHERE request_id = ?',
      ['rejected', requestId]
    );

    // Update fee challan status
    await runAsync(
      'UPDATE fee_challans SET status = ? WHERE request_id = ?',
      ['rejected', requestId]
    );

    res.json({ success: true, message: 'Enrollment request rejected!' });
  } catch (err) {
    console.error('Reject enrollment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

