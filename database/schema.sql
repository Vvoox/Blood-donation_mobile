-- ============================================================
-- BloodLink - Blood Donation App Database Schema
-- Database: PostgreSQL (db.3olba.com)
-- ============================================================

-- Create database (run as superuser)
-- CREATE DATABASE blood_donation WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

\c blood_donation;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE blood_type_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE urgency_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE request_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED');
CREATE TYPE donation_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    keycloak_id      VARCHAR(255) UNIQUE NOT NULL,
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    phone_number     VARCHAR(20),
    city             VARCHAR(100),
    country          VARCHAR(100) DEFAULT 'Morocco',
    address          TEXT,
    birth_date       DATE,
    blood_type       blood_type_enum,
    is_active        BOOLEAN DEFAULT TRUE,
    profile_image    VARCHAR(500),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_keycloak_id   ON users(keycloak_id);
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_users_blood_type    ON users(blood_type);
CREATE INDEX idx_users_city          ON users(city);
CREATE INDEX idx_users_active        ON users(is_active);

-- ============================================================
-- GIVERS (DONORS) TABLE
-- ============================================================

CREATE TABLE givers (
    id                  BIGSERIAL PRIMARY KEY,
    giver_uuid          UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_type          blood_type_enum NOT NULL,
    is_available        BOOLEAN DEFAULT TRUE,
    last_donation_date  DATE,
    next_available_date DATE,
    total_donations     INTEGER DEFAULT 0,
    city                VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_givers_user_id     ON givers(user_id);
CREATE INDEX idx_givers_blood_type  ON givers(blood_type);
CREATE INDEX idx_givers_available   ON givers(is_available);
CREATE INDEX idx_givers_city        ON givers(city);
CREATE UNIQUE INDEX idx_givers_user_unique ON givers(user_id);

-- ============================================================
-- BENEFICIARIES TABLE
-- ============================================================

CREATE TABLE beneficiaries (
    id                  BIGSERIAL PRIMARY KEY,
    beneficiary_uuid    UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_type_needed   blood_type_enum NOT NULL,
    urgency_level       urgency_level_enum DEFAULT 'MEDIUM',
    hospital_name       VARCHAR(255),
    city                VARCHAR(100),
    notes               TEXT,
    status              request_status_enum DEFAULT 'PENDING',
    required_date       DATE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_user_id     ON beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_blood_type  ON beneficiaries(blood_type_needed);
CREATE INDEX idx_beneficiaries_status      ON beneficiaries(status);
CREATE INDEX idx_beneficiaries_urgency     ON beneficiaries(urgency_level);
CREATE INDEX idx_beneficiaries_city        ON beneficiaries(city);

-- ============================================================
-- DONATION REQUESTS TABLE
-- ============================================================

CREATE TABLE donation_requests (
    id                  BIGSERIAL PRIMARY KEY,
    request_uuid        UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    giver_id            BIGINT NOT NULL REFERENCES givers(id),
    beneficiary_id      BIGINT NOT NULL REFERENCES beneficiaries(id),
    status              donation_status_enum DEFAULT 'PENDING',
    donation_date       DATE,
    location            VARCHAR(255),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_donation_requests_giver_id       ON donation_requests(giver_id);
CREATE INDEX idx_donation_requests_beneficiary_id ON donation_requests(beneficiary_id);
CREATE INDEX idx_donation_requests_status         ON donation_requests(status);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    type        VARCHAR(50) DEFAULT 'INFO',
    is_read     BOOLEAN DEFAULT FALSE,
    data        JSONB,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON notifications(is_read);
CREATE INDEX idx_notifications_type     ON notifications(type);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_givers_updated_at
    BEFORE UPDATE ON givers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
    BEFORE UPDATE ON beneficiaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donation_requests_updated_at
    BEFORE UPDATE ON donation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================

-- Available donors with user info
CREATE VIEW available_donors AS
SELECT
    g.giver_uuid,
    g.blood_type,
    g.is_available,
    g.last_donation_date,
    g.next_available_date,
    g.total_donations,
    g.city AS donor_city,
    g.notes,
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_number,
    u.city AS user_city,
    u.country,
    g.created_at
FROM givers g
JOIN users u ON g.user_id = u.id
WHERE g.is_available = TRUE
  AND u.is_active = TRUE;

-- Blood type availability summary
CREATE VIEW blood_type_availability AS
SELECT
    blood_type,
    COUNT(*) AS total_donors,
    COUNT(*) FILTER (WHERE is_available = TRUE) AS available_donors
FROM givers g
JOIN users u ON g.user_id = u.id
WHERE u.is_active = TRUE
GROUP BY blood_type
ORDER BY blood_type;

-- ============================================================
-- SEED DATA (Sample donors for testing)
-- ============================================================

-- Note: In production, users are created via Keycloak
-- These are sample entries for development/testing

INSERT INTO users (keycloak_id, first_name, last_name, email, phone_number, city, country, blood_type) VALUES
    ('kc-seed-001', 'Youssef', 'El Amrani', 'youssef.elamrani@example.com', '+212661234567', 'Casablanca', 'Morocco', 'O+'),
    ('kc-seed-002', 'Fatima', 'Benali', 'fatima.benali@example.com', '+212662345678', 'Rabat', 'Morocco', 'A+'),
    ('kc-seed-003', 'Mehdi', 'Tazi', 'mehdi.tazi@example.com', '+212663456789', 'Marrakech', 'Morocco', 'B+'),
    ('kc-seed-004', 'Nadia', 'Cherkaoui', 'nadia.cherkaoui@example.com', '+212664567890', 'Fes', 'Morocco', 'AB+'),
    ('kc-seed-005', 'Omar', 'Mansouri', 'omar.mansouri@example.com', '+212665678901', 'Tangier', 'Morocco', 'O-'),
    ('kc-seed-006', 'Salma', 'Idrissi', 'salma.idrissi@example.com', '+212666789012', 'Agadir', 'Morocco', 'A-'),
    ('kc-seed-007', 'Hamid', 'Boussouf', 'hamid.boussouf@example.com', '+212667890123', 'Meknes', 'Morocco', 'B-'),
    ('kc-seed-008', 'Zineb', 'Ouali', 'zineb.ouali@example.com', '+212668901234', 'Oujda', 'Morocco', 'AB-'),
    ('kc-seed-009', 'Karim', 'Alaoui', 'karim.alaoui@example.com', '+212669012345', 'Casablanca', 'Morocco', 'O+'),
    ('kc-seed-010', 'Aicha', 'Saidi', 'aicha.saidi@example.com', '+212660123456', 'Rabat', 'Morocco', 'A+');

INSERT INTO givers (user_id, blood_type, is_available, last_donation_date, total_donations, city) VALUES
    (1, 'O+',  TRUE,  '2025-12-01', 8,  'Casablanca'),
    (2, 'A+',  TRUE,  '2026-01-15', 5,  'Rabat'),
    (3, 'B+',  FALSE, '2026-02-10', 3,  'Marrakech'),
    (4, 'AB+', TRUE,  '2025-11-20', 12, 'Fes'),
    (5, 'O-',  TRUE,  '2026-01-05', 7,  'Tangier'),
    (6, 'A-',  TRUE,  '2025-10-30', 4,  'Agadir'),
    (7, 'B-',  FALSE, '2026-02-28', 2,  'Meknes'),
    (8, 'AB-', TRUE,  '2025-09-15', 6,  'Oujda'),
    (9, 'O+',  TRUE,  '2026-01-20', 10, 'Casablanca'),
    (10,'A+',  TRUE,  '2026-02-05', 4,  'Rabat');

-- ============================================================
-- GRANTS
-- ============================================================

-- Create application user (run as superuser)
-- CREATE USER blood_app WITH PASSWORD 'change_this_password';
-- GRANT CONNECT ON DATABASE blood_donation TO blood_app;
-- GRANT USAGE ON SCHEMA public TO blood_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blood_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO blood_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO blood_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO blood_app;
