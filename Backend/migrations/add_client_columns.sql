-- Migration: add missing client columns (NIC_No, Country, Visa_source, Absconding_type)
-- Run in your MySQL client. Requires MySQL 8.0+ for "IF NOT EXISTS" on ADD COLUMN.
-- First check current columns:
-- SHOW COLUMNS FROM client;

-- Safe ALTERs (MySQL 8+)
ALTER TABLE client ADD COLUMN IF NOT EXISTS NIC_No VARCHAR(100) NULL;
ALTER TABLE client ADD COLUMN IF NOT EXISTS Country VARCHAR(100) NULL;
ALTER TABLE client ADD COLUMN IF NOT EXISTS Visa_source VARCHAR(100) NULL;
ALTER TABLE client ADD COLUMN IF NOT EXISTS Absconding_type VARCHAR(100) NULL;


-- If your MySQL version does not support ADD COLUMN IF NOT EXISTS, you can run the following
-- queries manually (check results of the SELECT first):
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client' AND COLUMN_NAME = 'NIC_No';
-- If the column is missing, run:
-- ALTER TABLE client ADD COLUMN NIC_No VARCHAR(100) NULL;
-- ALTER TABLE client ADD COLUMN Country VARCHAR(100) NULL;
-- ALTER TABLE client ADD COLUMN Visa_source VARCHAR(100) NULL;
-- ALTER TABLE client ADD COLUMN Absconding_type VARCHAR(100) NULL;

-- After running, verify:
-- SHOW COLUMNS FROM client;
-- SELECT Id, NIC_No, Country, Visa_source, Absconding_type FROM client LIMIT 5;

-- Notes:
-- 1) These columns are added as NULLable to avoid breaking existing INSERTs. If you require NOT NULL, alter later and provide defaults.
-- 2) If your schema uses different casing (e.g., "nic_no"), adjust the column names accordingly or let me know and I can update the model instead.
-- 3) If you'd like, I can create a small Node.js script to run this migration against your DB (you'd need to provide DB connection parameters locally).
