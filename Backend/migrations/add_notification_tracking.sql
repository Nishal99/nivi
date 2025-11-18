CREATE TABLE IF NOT EXISTS notification_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    notification_type ENUM('month_before', 'week_before', 'week_after') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed') NOT NULL,
    error_message TEXT,
    FOREIGN KEY (client_id) REFERENCES client(Id) ON DELETE CASCADE
);

-- Add index for querying notification history
CREATE INDEX idx_notification_client ON notification_history(client_id, notification_type);