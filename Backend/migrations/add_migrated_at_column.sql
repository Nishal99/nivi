-- Migration: add 'migrated_at' column to client and client_history tables
-- Adds a DATE column named migrated_at if it does not already exist.
-- Run this against your MySQL database (for example with the mysql CLI):
--   mysql -u <user> -p < database_name > < add_migrated_at_column.sql

-- Add to client table
ALTER TABLE client ADD COLUMN IF NOT EXISTS migrated_at DATE NULL;

-- Add to client_history table
ALTER TABLE client_history ADD COLUMN IF NOT EXISTS migrated_at DATE NULL;

-- Notes:
-- 1) This migration marks the fields as NULLable to avoid breaking existing writes.
-- 2) If your MySQL version doesn't support ADD COLUMN IF NOT EXISTS, run the following commands instead:
--    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client' AND COLUMN_NAME = 'migrated_at';
--    If missing, run: ALTER TABLE client ADD COLUMN migrated_at DATE NULL;
--    Repeat for table client_history.
