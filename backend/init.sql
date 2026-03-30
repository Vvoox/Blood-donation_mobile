-- Run this against the existing core-postgres container:
-- docker exec -i core-postgres psql -U mysqool_user -d bloodlink < backend/init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id VARCHAR(255) NOT NULL,
  creator_name VARCHAR(255) NOT NULL,
  blood_types TEXT[] NOT NULL DEFAULT '{}',
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL DEFAULT 'Morocco',
  contact_phone VARCHAR(40),
  contact_phone_visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  people_needed INTEGER NOT NULL DEFAULT 1,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id VARCHAR(255) NOT NULL,
  donor_name VARCHAR(255) NOT NULL,
  donor_blood_type VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, donor_id)
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id VARCHAR(255) NOT NULL,
  donor_name VARCHAR(255) NOT NULL,
  donor_blood_type VARCHAR(10),
  requester_id VARCHAR(255) NOT NULL,
  requester_name VARCHAR(255) NOT NULL,
  blood_types TEXT[] NOT NULL DEFAULT '{}',
  city VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  attachment_type VARCHAR(20),
  attachment_data TEXT,
  attachment_mime_type VARCHAR(120),
  attachment_name VARCHAR(255),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_data TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(120);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40);
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS contact_phone_visibility VARCHAR(20) NOT NULL DEFAULT 'private';

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  related_chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_request_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id VARCHAR(255) NOT NULL,
  donor_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed demo requests
INSERT INTO blood_requests (creator_id, creator_name, blood_types, city, country, people_needed, deadline, notes)
VALUES
  ('seed-1', 'Fatima Benali',  '{"O+","O-"}', 'Casablanca', 'Morocco', 3, NOW() + INTERVAL '3 days',  'Urgent need after surgery'),
  ('seed-2', 'Hassan Berrada', '{}',           'Casablanca', 'Morocco', 2, NOW() + INTERVAL '7 days',  'Any blood type welcome'),
  ('seed-3', 'Zineb Lahlou',   '{"A+"}',       'Rabat',      'Morocco', 1, NOW() + INTERVAL '24 hours','Critical - please help'),
  ('seed-4', 'Karim Fassi',    '{"B+","AB+"}', 'Marrakech',  'Morocco', 4, NOW() + INTERVAL '5 days',  NULL)
ON CONFLICT DO NOTHING;
