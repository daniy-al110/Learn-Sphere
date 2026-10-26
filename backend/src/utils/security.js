const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COURSE_TOKENS_FILE = path.resolve(__dirname, '../data/course_tokens.json');

// Memory store for IP attempts and bans
// Structure: { [ip]: { failedAttempts: number, bannedUntil: number | null } }
const ipRateLimitStore = new Map();

function ensureDataFile() {
  const dir = path.dirname(COURSE_TOKENS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(COURSE_TOKENS_FILE)) {
    fs.writeFileSync(COURSE_TOKENS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readCourseTokens() {
  try {
    ensureDataFile();
    const data = fs.readFileSync(COURSE_TOKENS_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    return {};
  }
}

function writeCourseTokens(tokens) {
  try {
    ensureDataFile();
    fs.writeFileSync(COURSE_TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing course tokens:', e.message);
  }
}

/**
 * Generate a high-entropy 24-character token
 * e.g. "LS-tok-9f8a3c7b2e1d4a6f8b0c"
 */
function generateHighEntropyToken(courseId) {
  const randomHex = crypto.randomBytes(12).toString('hex');
  return `LS-tok-${courseId}-${randomHex}`;
}

/**
 * Get or create high-entropy token for a course
 */
function getCourseTokenInfo(courseId) {
  const store = readCourseTokens();
  const idStr = String(courseId);
  if (!store[idStr]) {
    store[idStr] = {
      courseId: Number(courseId),
      token: generateHighEntropyToken(courseId),
      isPublicLinkEnabled: true, // Invite-only toggle (true = public link allowed, false = invite-only)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    writeCourseTokens(store);
  }
  return store[idStr];
}

/**
 * Regenerate token for a course (revokes old token instantly)
 */
function regenerateCourseToken(courseId) {
  const store = readCourseTokens();
  const idStr = String(courseId);
  const newToken = generateHighEntropyToken(courseId);
  store[idStr] = {
    ...(store[idStr] || { courseId: Number(courseId) }),
    token: newToken,
    updatedAt: new Date().toISOString()
  };
  writeCourseTokens(store);
  return store[idStr];
}

/**
 * Toggle invite-only mode for a course
 */
function toggleCoursePublicLink(courseId, enabled) {
  const store = readCourseTokens();
  const idStr = String(courseId);
  if (!store[idStr]) {
    getCourseTokenInfo(courseId);
  }
  const current = readCourseTokens();
  current[idStr].isPublicLinkEnabled = Boolean(enabled);
  current[idStr].updatedAt = new Date().toISOString();
  writeCourseTokens(current);
  return current[idStr];
}

/**
 * Check IP ban status
 */
function checkIpBan(ip) {
  const record = ipRateLimitStore.get(ip);
  if (!record) return { isBanned: false };
  if (record.bannedUntil && Date.now() < record.bannedUntil) {
    const minutesLeft = Math.ceil((record.bannedUntil - Date.now()) / (60 * 1000));
    return { isBanned: true, minutesLeft };
  }
  // Ban expired, reset
  if (record.bannedUntil && Date.now() >= record.bannedUntil) {
    ipRateLimitStore.delete(ip);
  }
  return { isBanned: false };
}

/**
 * Register failed token attempt. Bans IP after 3 attempts for 30 minutes.
 */
function registerFailedAttempt(ip) {
  const record = ipRateLimitStore.get(ip) || { failedAttempts: 0, bannedUntil: null };
  record.failedAttempts += 1;
  if (record.failedAttempts >= 3) {
    record.bannedUntil = Date.now() + 30 * 60 * 1000; // 30 mins
  }
  ipRateLimitStore.set(ip, record);
  return record;
}

/**
 * Reset failed attempts on successful token verification
 */
function resetFailedAttempts(ip) {
  ipRateLimitStore.delete(ip);
}

/**
 * Verify token strictly (exact match + IP rate limit check)
 */
function verifyTokenStrict(token, ip) {
  const banStatus = checkIpBan(ip);
  if (banStatus.isBanned) {
    return {
      valid: false,
      status: 429,
      error: `Too many invalid attempts. Your IP has been temporarily banned for security. Try again in ${banStatus.minutesLeft} minutes.`
    };
  }

  if (!token || typeof token !== 'string') {
    const rec = registerFailedAttempt(ip);
    return {
      valid: false,
      status: 400,
      error: `Invalid token. (${3 - rec.failedAttempts} attempts remaining before IP auto-ban)`
    };
  }

  const store = readCourseTokens();
  const matchedEntry = Object.values(store).find(entry => entry.token === token.trim());

  if (!matchedEntry) {
    const rec = registerFailedAttempt(ip);
    if (rec.failedAttempts >= 3) {
      return {
        valid: false,
        status: 429,
        error: "Too many failed attempts. Your IP has been banned for 30 minutes."
      };
    }
    return {
      valid: false,
      status: 403,
      error: `Invalid or expired class token. (${3 - rec.failedAttempts} attempts remaining before IP auto-ban)`
    };
  }

  if (!matchedEntry.isPublicLinkEnabled) {
    return {
      valid: false,
      status: 403,
      error: "This class is currently set to Invite-Only. Public link joining is disabled by the academy."
    };
  }

  resetFailedAttempts(ip);
  return {
    valid: true,
    courseId: matchedEntry.courseId
  };
}

module.exports = {
  getCourseTokenInfo,
  regenerateCourseToken,
  toggleCoursePublicLink,
  verifyTokenStrict,
  checkIpBan,
  registerFailedAttempt
};
