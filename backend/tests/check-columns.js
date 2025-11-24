const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) { console.error('open error', err); process.exit(1); }
});

function allAsync(sql, params=[]) { return new Promise((res, rej)=> db.all(sql, params, (e,r)=> e?rej(e):res(r))); }
function runAsync(sql, params=[]) { return new Promise((res, rej)=> db.run(sql, params, function(e){ if(e) rej(e); else res(this); })); }

(async ()=>{
  try {
    const cols = await allAsync("PRAGMA table_info(courses)");
    console.log('columns:', cols.map(c=>c.name));
    const names = cols.map(c=>c.name);
    if(!names.includes('schedule')){
      console.log('Adding schedule column');
      await runAsync('ALTER TABLE courses ADD COLUMN schedule TEXT');
    }
    if(!names.includes('duration')){
      console.log('Adding duration column');
      await runAsync('ALTER TABLE courses ADD COLUMN duration TEXT');
    }
    const cols2 = await allAsync("PRAGMA table_info(courses)");
    console.log('final columns:', cols2.map(c=>c.name));
    console.log('done');
  } catch (e) {
    console.error('error', e.message);
    process.exit(1);
  } finally {
    db.close();
  }
})();
