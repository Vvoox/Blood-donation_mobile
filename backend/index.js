'use strict';

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();
const PORT = process.env.PORT || 8082;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'blood-donation';

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ─── JWKS client ─────────────────────────────────────────────────────────────
const jwks = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

function getSigningKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

/**
 * JWT authentication middleware.
 * Verifies the Bearer token against Keycloak's JWKS endpoint and attaches
 * the decoded user object to req.user.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.slice(7);

  jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
    }

    // Extract user info from token claims
    const given = decoded.given_name || '';
    const family = decoded.family_name || '';
    const fullName = [given, family].filter(Boolean).join(' ') || decoded.preferred_username || decoded.email || 'Unknown';

    // Custom attributes can be top-level claims or under a namespace
    const attributes = decoded.attributes || {};
    req.user = {
      userId: decoded.sub,
      name: fullName,
      email: decoded.email || '',
      city: decoded.city || attributes.city || '',
      bloodType: decoded.bloodType || attributes.bloodType || decoded.blood_type || '',
    };

    next();
  });
}

// ─── Public routes ────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all active blood requests
app.get('/requests', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM blood_requests ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /requests error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get requests filtered by city
app.get('/requests/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const result = await pool.query(
      `SELECT * FROM blood_requests WHERE LOWER(city) = LOWER($1) ORDER BY created_at DESC`,
      [city]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /requests/city/:city error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ─── Protected routes ─────────────────────────────────────────────────────────

// Get requests created by the logged-in user
app.get('/requests/my', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM blood_requests WHERE creator_id = $1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /requests/my error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create a new blood request
app.post('/requests', requireAuth, async (req, res) => {
  try {
    const { bloodTypes, city, country, peopleNeeded, deadline, notes } = req.body;

    if (!city || !deadline) {
      return res.status(400).json({ error: 'city and deadline are required' });
    }

    const result = await pool.query(
      `INSERT INTO blood_requests
         (creator_id, creator_name, blood_types, city, country, people_needed, deadline, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.userId,
        req.user.name,
        bloodTypes || [],
        city,
        country || 'Morocco',
        peopleNeeded || 1,
        deadline,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /requests error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Accept a blood request (creates acceptance record + chat)
app.post('/requests/:id/accept', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Fetch the request
    const reqResult = await client.query(
      `SELECT * FROM blood_requests WHERE id = $1`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Blood request not found' });
    }

    const bloodRequest = reqResult.rows[0];

    if (bloodRequest.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This blood request is no longer active' });
    }

    if (bloodRequest.creator_id === req.user.userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You cannot accept your own blood request' });
    }

    // Check if user already accepted
    const existingAcceptance = await client.query(
      `SELECT id FROM request_acceptances WHERE request_id = $1 AND donor_id = $2`,
      [id, req.user.userId]
    );

    if (existingAcceptance.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You have already accepted this request' });
    }

    // Insert acceptance
    await client.query(
      `INSERT INTO request_acceptances (request_id, donor_id, donor_name, donor_blood_type)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.userId, req.user.name, req.user.bloodType || null]
    );

    // Increment accepted_count
    await client.query(
      `UPDATE blood_requests SET accepted_count = accepted_count + 1 WHERE id = $1`,
      [id]
    );

    // Create a chat between donor (current user) and requester
    const chatResult = await client.query(
      `INSERT INTO chats
         (request_id, donor_id, donor_name, donor_blood_type,
          requester_id, requester_name, blood_types, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        req.user.userId,
        req.user.name,
        req.user.bloodType || null,
        bloodRequest.creator_id,
        bloodRequest.creator_name,
        bloodRequest.blood_types,
        bloodRequest.city,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ chat: chatResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /requests/:id/accept error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  } finally {
    client.release();
  }
});

// Get all chats for the logged-in user (as donor or requester)
app.get('/chats', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              (SELECT text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
              (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != $1 AND m.read = FALSE)::int AS unread_count
       FROM chats c
       WHERE c.donor_id = $1 OR c.requester_id = $1
       ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /chats error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get a single chat with its messages
app.get('/chats/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const chatResult = await pool.query(
      `SELECT * FROM chats WHERE id = $1`,
      [id]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatResult.rows[0];

    // Ensure the user is a participant
    if (chat.donor_id !== req.user.userId && chat.requester_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messagesResult = await pool.query(
      `SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    // Mark messages from the other party as read
    await pool.query(
      `UPDATE messages SET read = TRUE WHERE chat_id = $1 AND sender_id != $2`,
      [id, req.user.userId]
    );

    res.json({ chat, messages: messagesResult.rows });
  } catch (err) {
    console.error('GET /chats/:id error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Send a message in a chat
app.post('/chats/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Verify chat exists and user is a participant
    const chatResult = await pool.query(
      `SELECT * FROM chats WHERE id = $1`,
      [id]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatResult.rows[0];
    if (chat.donor_id !== req.user.userId && chat.requester_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, sender_name, text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.user.userId, req.user.name, text.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /chats/:id/messages error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get current user profile from token
app.get('/users/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`BloodLink API running on port ${PORT}`);
});
