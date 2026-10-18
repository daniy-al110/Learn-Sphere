const express = require('express');
const cors = require('cors');
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { initPoolWithIPv4 } = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

process.on('exit', (code) => console.log('*** process exit event, code=' + code));
process.on('uncaughtException', (err) => console.error('*** uncaughtException:', err && err.stack ? err.stack : err));
process.on('unhandledRejection', (reason, promise) => console.error('*** unhandledRejection at:', promise, 'reason:', reason));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LearnSphere LMS Backend</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #090d16; color: #f8fafc; padding: 1.5rem; }
          .card { background: #131b2e; padding: 2.5rem; border-radius: 1rem; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 500px; width: 100%; }
          .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.4rem 1rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.25rem; border: 1px solid rgba(16, 185, 129, 0.3); }
          .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
          h1 { font-size: 1.85rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.75rem; letter-spacing: -0.025em; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
          .btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.65rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: background 0.2s; }
          .btn:hover { background: #1d4ed8; }
          .footer { margin-top: 1.75rem; font-size: 0.8rem; color: #64748b; border-top: 1px solid #1e293b; padding-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> Backend Active & Online</div>
          <h1>LearnSphere REST API</h1>
          <p>The backend server for LearnSphere LMS is running smoothly on Render and ready to handle frontend client requests.</p>
          <a class="btn" href="/api/health">Check API Health</a>
          <div class="footer">LearnSphere LMS • Connected to Supabase Remote PostgreSQL</div>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK', uptime: process.uptime(), timestamp: Date.now() });
});

// Routes
app.use('/api', require('./src/routes/generalRoutes'));
app.use('/api/student', require('./src/routes/studentRoutes'));
app.use('/api/teacher', require('./src/routes/teacherRoutes'));
app.use('/api/instructor', require('./src/routes/instructorRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/courses', require('./src/routes/coursesRoutes'));
app.use('/api/course', require('./src/routes/courseRoutes'));
app.use('/api/debug', require('./src/routes/debugRoutes'));
app.use('/api/super-admin', require('./src/routes/superAdminRoutes'));
app.use('/api/meetings', require('./src/routes/meetingsRoutes'));
app.use('/api/lectures', require('./src/routes/lecturesRoutes'));

(async () => {
  try {
    await initPoolWithIPv4();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server listening: http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Fatal startup error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
