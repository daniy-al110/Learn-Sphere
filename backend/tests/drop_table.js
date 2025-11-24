const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE);

db.run("DROP TABLE IF EXISTS Contact Us", (err) => {
    if (err) {
        console.error("Error dropping table:", err.message);
    } else {
        console.log("Table 'Contact Us' dropped successfully.");
    }
    db.close();
});
