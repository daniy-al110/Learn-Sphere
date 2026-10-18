
const { Pool } = require("pg");
const dnsModule = require('dns');
if (typeof dnsModule.setDefaultResultOrder === 'function') {
  dnsModule.setDefaultResultOrder('ipv4first');
}
const dns = dnsModule.promises;
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qupkoahkwisctivxmtlf.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL. Add your Supabase connection string to backend/.env");
  process.exit(1);
}

let pool;
let poolAvailable = false;
let _resolvePoolReady;
const poolReady = new Promise((resolve) => { _resolvePoolReady = resolve; });

async function initPoolWithIPv4() {
  let connString = DATABASE_URL;
  try {
    const parsed = new URL(DATABASE_URL);
    const host = parsed.hostname;
    let resolved = false;
    try {
      const records = await dns.resolve4(host);
      if (Array.isArray(records) && records.length > 0) {
        parsed.hostname = records[0];
        connString = parsed.toString();
        resolved = true;
      }
    } catch (dnsErr) {
      try {
        const lookup = await dns.lookup(host, { family: 4 });
        if (lookup && lookup.address) {
          parsed.hostname = lookup.address;
          connString = parsed.toString();
          resolved = true;
        }
      } catch (lookupErr) {}
    }
    if (!resolved) console.warn('IPv4 database resolution failed; using original hostname:', host);
  } catch (e) {
    console.warn('Failed to parse DATABASE_URL for DNS resolution, using original string');
  }

  pool = new Pool({
    connectionString: connString,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    ssl: process.env.SUPABASE_SSL === "false" || process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  });
  
  try {
    await pool.query('SELECT 1');
    poolAvailable = true;
    console.log('✅ Supabase PostgreSQL connected');
    if (typeof _resolvePoolReady === 'function') _resolvePoolReady();
  } catch (err) {
    poolAvailable = false;
    console.warn('PostgreSQL direct connection unavailable:', err.message);
    console.warn('⚠️ Continuing anyway (Supabase Client fallback enabled)');
    if (typeof _resolvePoolReady === 'function') _resolvePoolReady();
  }
}

let transactionClient = null;

function normalizeSql(sql) {
  if (sql == null) return sql;
  let text = String(sql);
  if (/^PRAGMA\b/i.test(text.trim())) return null;
  text = text.replace(/INSERT OR IGNORE INTO\s+([^\(]+?)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi, "INSERT INTO $1 ($2) VALUES ($3) ON CONFLICT DO NOTHING");
  text = text.replace(/INSERT OR REPLACE INTO\s+assignment_submissions\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi, "INSERT INTO assignment_submissions ($1) VALUES ($2) ON CONFLICT (assignment_id, student_id) DO UPDATE SET marks = EXCLUDED.marks, submitted_at = CURRENT_TIMESTAMP");
  text = text.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY");
  text = text.replace(/BOOLEAN DEFAULT 0/gi, "BOOLEAN DEFAULT FALSE");
  text = text.replace(/BOOLEAN DEFAULT 1/gi, "BOOLEAN DEFAULT TRUE");
  text = text.replace(/TEXT DEFAULT CURRENT_TIMESTAMP/gi, "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  text = text.replace(/AUTOINCREMENT/gi, "SERIAL");
  return text;
}

function toPgParams(sql, params = []) {
  const values = Array.isArray(params) ? params : [params];
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values };
}

async function getQueryClient(sql) {
  const text = String(sql || "").trim();
  if (/^BEGIN\b/i.test(text)) {
    if (!transactionClient) transactionClient = await pool.connect();
    return transactionClient;
  }
  if (transactionClient) return transactionClient;
  return pool;
}

function releaseTransactionClient() {
  if (transactionClient) {
    try { transactionClient.release(); } catch (e) {}
    transactionClient = null;
  }
}

async function executeSql(sql, params = []) {
  const normalized = normalizeSql(sql);
  if (normalized == null) return { rows: [], rowCount: 0, command: "PRAGMA" };

  if (/^CREATE\s+TABLE|^ALTER\s+TABLE|^CREATE\s+UNIQUE\s+INDEX/i.test(normalized.trim())) {
    return { rows: [], rowCount: 0 };
  }

  const selectEmailMatch = normalized.match(/^SELECT\s+\*\s+FROM\s+(\w+)\s+WHERE\s+email\s*=\s*\?/i);
  if (selectEmailMatch && params.length === 1) {
    const table = selectEmailMatch[1];
    try {
      const { data, error } = await supabase.from(table).select('*').eq('email', params[0]);
      if (error) throw error;
      return { rows: data, rowCount: data.length };
    } catch (e) { console.error(`[Supabase Client] Error:`, e); }
  }

  const selectAllMatch = normalized.match(/^SELECT\s+\*\s+FROM\s+(\w+)$/i);
  if (selectAllMatch && (!params || params.length === 0)) {
    const table = selectAllMatch[1];
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return { rows: data, rowCount: data.length };
    } catch (e) { console.error(`[Supabase Client] Error:`, e); }
  }

  const insertMatch = normalized.match(/^INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i);
  if (insertMatch) {
    const table = insertMatch[1];
    const columns = insertMatch[2].split(',').map(c => c.trim());
    const placeholders = insertMatch[3].split(',').map(p => p.trim());
    if (placeholders.every(p => p === '?') && placeholders.length === columns.length && params.length === columns.length) {
      const row = {};
      columns.forEach((col, i) => { row[col] = params[i]; });
      try {
        const { data, error } = await supabase.from(table).insert(row).select();
        if (error) throw error;
        return { rows: data, rowCount: data ? data.length : 0 };
      } catch (e) { console.error(`[Supabase Client] Error:`, e); }
    }
  }

  await poolReady;

  const { text, values } = toPgParams(normalized, params);
  const client = await getQueryClient(text);
  const isTransactionBoundary = /^COMMIT\b|^ROLLBACK\b/i.test(text.trim());

  try {
    const result = await client.query(text, values);
    if (isTransactionBoundary) releaseTransactionClient();
    return result;
  } catch (error) {
    if (/^BEGIN\b|^COMMIT\b|^ROLLBACK\b/i.test(text.trim())) releaseTransactionClient();
    throw error;
  }
}

function getAsync(sql, params = []) { return executeSql(sql, params).then((result) => result.rows[0] || null); }
function runAsync(sql, params = []) {
  const normalized = normalizeSql(sql);
  if (normalized == null) return Promise.resolve({ lastID: 0, changes: 0 });
  let execSql = normalized;
  if (/^INSERT\b/i.test(execSql.trim()) && !/\bRETURNING\b/i.test(execSql)) execSql = `${execSql} RETURNING *`;
  return executeSql(execSql, params).then((result) => {
    let lastID = null;
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      const idKey = Object.keys(row).find((key) => /(?:^|_)id$/i.test(key));
      if (idKey && row[idKey] != null) lastID = row[idKey];
      else if (row.id != null) lastID = row.id;
    }
    return { lastID, changes: result.rowCount || 0 };
  });
}
function allAsync(sql, params = []) { return executeSql(sql, params).then((result) => result.rows || []); }

const db = {
  get(sql, params, callback) {
    if (typeof params === "function") { callback = params; params = []; }
    executeSql(sql, params).then((result) => callback && callback(null, result.rows[0] || null)).catch((err) => callback && callback(err));
  },
  all(sql, params, callback) {
    if (typeof params === "function") { callback = params; params = []; }
    executeSql(sql, params).then((result) => callback && callback(null, result.rows || [])).catch((err) => callback && callback(err));
  },
  run(sql, params, callback) {
    if (typeof params === "function") { callback = params; params = []; }
    runAsync(sql, params).then((result) => { if (callback) callback.call({ lastID: result.lastID, changes: result.changes }, null); })
      .catch((err) => { if (callback) callback.call({ lastID: null, changes: 0 }, err); else console.error('DB run error:', err.message); });
  },
  prepare(sql) {
    return {
      run(params, callback) {
        if (typeof params === "function") { callback = params; params = []; }
        runAsync(sql, params).then((result) => { if (callback) callback.call({ lastID: result.lastID, changes: result.changes }, null); }).catch((err) => { if (callback) callback.call({ lastID: null, changes: 0 }, err); });
      },
      finalize(callback) { if (callback) callback(null); },
    };
  },
  serialize(callback) { if (callback) callback(); },
};

module.exports = { db, supabase, initPoolWithIPv4, getAsync, runAsync, allAsync };
