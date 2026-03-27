CREATE DATABASE IF NOT EXISTS blood_donation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blood_donation;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Morocco',
  address TEXT,
  birth_date DATE,
  blood_type VARCHAR(5),
  keycloak_id VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blood_type (blood_type),
  INDEX idx_city (city),
  INDEX idx_keycloak_id (keycloak_id)
);

CREATE TABLE givers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  giver_uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  user_id BIGINT NOT NULL,
  blood_type VARCHAR(5) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  last_donation_date DATE,
  total_donations INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_blood_type (blood_type),
  INDEX idx_availability (is_available)
);

CREATE TABLE beneficiaries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  beneficiary_uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  user_id BIGINT NOT NULL,
  blood_type_needed VARCHAR(5) NOT NULL,
  urgency_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  hospital_name VARCHAR(255),
  city VARCHAR(100),
  notes TEXT,
  status ENUM('PENDING', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_blood_type (blood_type_needed),
  INDEX idx_status (status),
  INDEX idx_urgency (urgency_level)
);

CREATE TABLE donation_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  giver_id BIGINT NOT NULL,
  beneficiary_id BIGINT NOT NULL,
  status ENUM('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  donation_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (giver_id) REFERENCES givers(id),
  FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
  INDEX idx_status (status)
);
