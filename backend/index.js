'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();
const PORT = process.env.PORT || 8082;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'blood-donation';
const KEYCLOAK_ADMIN_REALM = process.env.KEYCLOAK_ADMIN_REALM || 'master';
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'blood-donation-admin';
const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '';

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

function firstValue(value) {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
}

function normalizeRequestRow(row) {
  if (!row) return row;
  return {
    ...row,
    blood_types: Array.isArray(row.blood_types) ? row.blood_types : [],
  };
}

function getSigningKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function getKeycloakAdminToken() {
  if (!KEYCLOAK_ADMIN_CLIENT_ID || !KEYCLOAK_ADMIN_CLIENT_SECRET) {
    const error = new Error('Keycloak admin client credentials are not configured');
    error.status = 500;
    throw error;
  }

  const tokenURL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_ADMIN_REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: KEYCLOAK_ADMIN_CLIENT_ID,
    client_secret: KEYCLOAK_ADMIN_CLIENT_SECRET,
  });

  const response = await fetch(tokenURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const error = new Error(data.error_description || data.error || 'Unable to authenticate with Keycloak admin');
    error.status = response.status || 500;
    throw error;
  }

  return data.access_token;
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
      city: firstValue(decoded.city) || firstValue(attributes.city) || '',
      bloodType: firstValue(decoded.bloodType) || firstValue(attributes.bloodType) || firstValue(decoded.blood_type) || '',
    };

    next();
  });
}

// ─── Public routes ────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('GET /health/db error:', err);
    res.status(500).json({ status: 'error', database: 'disconnected', details: err.message });
  }
});

// Register a new user in Keycloak
app.post('/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      city,
      bloodType,
      country,
      phoneNumber,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !city) {
      return res.status(400).json({
        error: 'email, password, firstName, lastName, and city are required',
      });
    }

    const adminToken = await getKeycloakAdminToken();
    const createURL = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`;

    const response = await fetch(createURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: email,
        email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ],
        attributes: {
          city: [city],
          country: [country || 'Morocco'],
          bloodType: [bloodType || ''],
          phoneNumber: [phoneNumber || ''],
        },
      }),
    });

    if (response.status === 409) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: 'Failed to create user in Keycloak',
        details: text || response.statusText,
      });
    }

    res.status(201).json({
      status: 'created',
      email,
      firstName,
      lastName,
      city,
      bloodType: bloodType || '',
    });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    res.status(err.status || 500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get all requests, with optional search filters
app.get('/requests', async (req, res) => {
  try {
    const { city, status, bloodType, creatorId, q } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;
    const where = [];
    const values = [];

    if (city) {
      values.push(String(city));
      where.push(`LOWER(city) = LOWER($${values.length})`);
    }

    if (status) {
      values.push(String(status));
      where.push(`LOWER(status) = LOWER($${values.length})`);
    }

    if (bloodType) {
      values.push(String(bloodType));
      where.push(`($${values.length} = ANY(blood_types) OR cardinality(blood_types) = 0)`);
    }

    if (creatorId) {
      values.push(String(creatorId));
      where.push(`creator_id = $${values.length}`);
    }

    if (q) {
      values.push(`%${String(q).trim()}%`);
      where.push(`(
        creator_name ILIKE $${values.length}
        OR city ILIKE $${values.length}
        OR COALESCE(notes, '') ILIKE $${values.length}
      )`);
    }

    values.push(limit);
    values.push(offset);

    const query = `
      SELECT *
      FROM blood_requests
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `;

    const result = await pool.query(query, values);
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('X-Has-More', String(result.rows.length === limit));
    res.json(result.rows.map(normalizeRequestRow));
  } catch (err) {
    console.error('GET /requests error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get requests filtered by city
app.get('/requests/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT * FROM blood_requests
       WHERE LOWER(city) = LOWER($1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [city, limit, offset]
    );
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('X-Has-More', String(result.rows.length === limit));
    res.json(result.rows.map(normalizeRequestRow));
  } catch (err) {
    console.error('GET /requests/city/:city error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get a single blood request
app.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM blood_requests WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    res.json(normalizeRequestRow(result.rows[0]));
  } catch (err) {
    console.error('GET /requests/:id error:', err);
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
    res.json(result.rows.map(normalizeRequestRow));
  } catch (err) {
    console.error('GET /requests/my error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create a new blood request
app.post('/requests', requireAuth, async (req, res) => {
  try {
    const bloodTypes = req.body.bloodTypes || req.body.blood_types || [];
    const city = req.body.city;
    const country = req.body.country;
    const peopleNeeded = req.body.peopleNeeded || req.body.people_needed;
    const deadline = req.body.deadline;
    const notes = req.body.notes;

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

    res.status(201).json(normalizeRequestRow(result.rows[0]));
  } catch (err) {
    console.error('POST /requests error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Update a blood request created by the logged-in user
app.put('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      `SELECT * FROM blood_requests WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    const current = existing.rows[0];
    if (current.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own requests' });
    }

    const bloodTypes = req.body.bloodTypes || req.body.blood_types || current.blood_types;
    const city = req.body.city || current.city;
    const country = req.body.country || current.country;
    const peopleNeeded = req.body.peopleNeeded || req.body.people_needed || current.people_needed;
    const deadline = req.body.deadline || current.deadline;
    const notes = Object.prototype.hasOwnProperty.call(req.body, 'notes') ? req.body.notes : current.notes;
    const status = req.body.status || current.status;

    const result = await pool.query(
      `UPDATE blood_requests
       SET blood_types = $2,
           city = $3,
           country = $4,
           people_needed = $5,
           deadline = $6,
           notes = $7,
           status = $8
       WHERE id = $1
       RETURNING *`,
      [id, bloodTypes, city, country, peopleNeeded, deadline, notes || null, status]
    );

    res.json(normalizeRequestRow(result.rows[0]));
  } catch (err) {
    console.error('PUT /requests/:id error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Delete a blood request created by the logged-in user
app.delete('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      `SELECT id, creator_id FROM blood_requests WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    if (existing.rows[0].creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own requests' });
    }

    await pool.query(`DELETE FROM blood_requests WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /requests/:id error:', err);
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
