#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, '..', 'database.db');
const BACKUP_FILE = path.join(__dirname, '..', `database.db.bak-${Date.now()}`);

function exitWith(err) {
  if (err) console.error('Error:', err && err.message ? err.message : err);
  process.exit(err ? 1 : 0);
}

try {
  if (!fs.existsSync(DB_FILE)) {
    console.error('Database file not found at', DB_FILE);
    process.exit(1);
  }

  // Backup DB
  fs.copyFileSync(DB_FILE, BACKUP_FILE);
  console.log('Backup created at', BACKUP_FILE);
} catch (e) {
  console.error('Failed to create backup:', e && e.message ? e.message : e);
  process.exit(1);
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return exitWith(err);
  console.log('Opened DB:', DB_FILE);

  db.serialize(() => {
    // Disable foreign key checks to ensure DROP works across schemas
    db.run('PRAGMA foreign_keys = OFF');

    const drops = [
      'DROP TABLE IF EXISTS quiz_responses',
      'DROP TABLE IF EXISTS quiz_questions',
      'DROP TABLE IF EXISTS quizzes'
    ];

    let i = 0;
    function runNext() {
      if (i >= drops.length) {
        db.run('PRAGMA foreign_keys = ON', (e) => {
          if (e) console.warn('Failed to re-enable foreign_keys:', e.message || e);
          console.log('Done. Please verify the DB (backup left at):', BACKUP_FILE);
          db.close(() => process.exit(0));
        });
        return;
      }
      const sql = drops[i++];
      console.log('Executing:', sql);
      db.run(sql, (err) => {
        if (err) {
          console.error('Failed to run:', sql, err && err.message ? err.message : err);
          // continue to next to attempt best-effort cleanup
        } else {
          console.log('Success:', sql);
        }
        runNext();
      });
    }

    runNext();
  });
});
