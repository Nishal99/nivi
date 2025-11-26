-- Add Status column to client_history table
USE visa_management;

ALTER TABLE client_history 
ADD COLUMN Status ENUM('archived', 'closed', 'status changed', 'absconded') DEFAULT 'archived' AFTER Agent_id;

-- Add index for better query performance
CREATE INDEX idx_ch_status ON client_history(Status);
