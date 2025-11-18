-- Create notification history table
CREATE TABLE IF NOT EXISTS notification_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    notification_type ENUM('month_before', 'week_before', 'week_after') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed') NOT NULL,
    error_message TEXT,
    FOREIGN KEY (client_id) REFERENCES client(Id)
);

-- Create daily notification stats table
CREATE TABLE IF NOT EXISTS notification_daily_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    successful INT NOT NULL DEFAULT 0,
    failed INT NOT NULL DEFAULT 0,
    skipped INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (date)
);