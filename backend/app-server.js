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

const fs = require('fs');

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

// Setup Next.js Frontend Handler
const frontendDir = path.resolve(__dirname, '../frontend-next');
let nextHandler = null;

async function setupNext() {
  const nextPkgPath = path.join(frontendDir, 'node_modules', 'next');
  if (fs.existsSync(frontendDir)) {
    try {
      const next = require(fs.existsSync(nextPkgPath) ? nextPkgPath : 'next');
      const dev = process.env.NODE_ENV !== 'production' && !fs.existsSync(path.join(frontendDir, '.next'));
      const nextApp = next({ dev, dir: frontendDir });
      await nextApp.prepare();
      nextHandler = nextApp.getRequestHandler();
      console.log('✅ Next.js frontend integrated on same port');
    } catch (e) {
      console.warn('⚠️ Next.js integration skipped or failed:', e.message);
    }
  }
}

// Next.js catch-all route handler for all non-API paths
app.all('*', (req, res) => {
  if (nextHandler) {
    return nextHandler(req, res);
  }
  res.status(404).send('Not Found');
});

(async () => {
  try {
    await initPoolWithIPv4();
    await setupNext();
    
    app.listen(PORT, () => {
      console.log(`🚀 Unified Fullstack Server listening: http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Fatal startup error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
