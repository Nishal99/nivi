-- Schema for visa_management
CREATE DATABASE IF NOT EXISTS visa_management;
USE visa_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Fullname VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Username VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('user','admin','agent') NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Status ENUM('active','inactive') NOT NULL,
    UNIQUE KEY uq_users_email (Email),
    INDEX idx_users_fullname (Fullname),
    INDEX idx_users_role (Role),
    INDEX idx_users_status (Status)
);

-- Profile table
CREATE TABLE IF NOT EXISTS profile (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    User_id INT,
    Profile_Img VARCHAR(255),
    Address VARCHAR(255),
    Phone VARCHAR(20),
    Bio TEXT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (User_id) REFERENCES users(Id) ON DELETE CASCADE,
    UNIQUE KEY uq_profile_phone (Phone)
);

-- Agent table
CREATE TABLE IF NOT EXISTS agent (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CompanyName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Contact VARCHAR(20) NOT NULL,
    ConPersonName VARCHAR(100) NOT NULL,
    ConPersonEmail VARCHAR(100) NOT NULL,
    ContPersonPhone VARCHAR(20) NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_agent_email (Email),
    UNIQUE KEY uq_agent_contact (Contact),
    INDEX idx_agent_company (CompanyName)
);

-- Client table
CREATE TABLE IF NOT EXISTS client (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Image VARCHAR(255),
    
    Passport_No VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Visa_approved_at DATE,
    migrated_at DATE,
    initial_period INT DEFAULT 0,
    Visa_period INT DEFAULT 0,
    Visa_expiry_date DATE,
    Visa_extend_for INT DEFAULT 0,
    visa_source VARCHAR(100),
    Visa_type VARCHAR(100),
    Agent_id INT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_agent FOREIGN KEY (Agent_id) REFERENCES agent(Id) ON DELETE SET NULL,
    INDEX idx_client_nic (NIC_No),
    INDEX idx_client_email (Email)
);

-- Client history table (archive expired clients)
CREATE TABLE IF NOT EXISTS client_history (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Original_Client_Id INT,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Image VARCHAR(255),
    Passport_No VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Country VARCHAR(100) NULL,
    Visa_approved_at DATE,
    migrated_at DATE,
    initial_period INT DEFAULT 0,
    Visa_period INT DEFAULT 0,
    Visa_expiry_date DATE,
    Visa_extend_for INT DEFAULT 0,
    visa_source VARCHAR(100),
    Visa_type VARCHAR(100),
    Agent_id INT,
    Moved_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ch_email (Email)
);

-- Scheduled event: move expired clients to client_history daily
-- Note: ENABLE the event scheduler on your MySQL server if it's not already enabled:
--   SET GLOBAL event_scheduler = ON;
-- The event below runs once per day and archives clients whose Visa_expiry_date is before today.
DELIMITER $$
CREATE EVENT IF NOT EXISTS move_expired_clients
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    -- Insert expired clients into history (preserve original Id)
    INSERT INTO client_history (Original_Client_Id, First_Name, Last_Name, Image, Passport_No, Email, Country, Visa_approved_at, migrated_at, initial_period, Visa_period, Visa_expiry_date, Visa_extend_for, visa_source, Visa_type, Agent_id)
    SELECT Id, First_Name, Last_Name, Image, Passport_No, Email, Country, Visa_approved_at, migrated_at, initial_period, Visa_period, Visa_expiry_date, Visa_extend_for, visa_source, Visa_type, Agent_id
    FROM client
    WHERE Visa_expiry_date IS NOT NULL AND Visa_expiry_date < CURDATE();

    -- Delete archived rows from client table
    DELETE FROM client WHERE Visa_expiry_date IS NOT NULL AND Visa_expiry_date < CURDATE();
END$$
DELIMITER ;