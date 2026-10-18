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
