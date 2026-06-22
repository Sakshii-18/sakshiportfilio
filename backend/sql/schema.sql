CREATE DATABASE IF NOT EXISTS sakshi_portfolio;

USE sakshi_portfolio;

CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  organization VARCHAR(150),
  service VARCHAR(80) NOT NULL,
  project_type VARCHAR(50),
  budget VARCHAR(50) NOT NULL,
  timeline VARCHAR(50),
  features TEXT,
  contact_method VARCHAR(40),
  message TEXT NOT NULL,
  reference_link VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  INDEX idx_enquiries_created_at (created_at)
);
