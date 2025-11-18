-- Extend enum to include new notification types
USE visa_management;
ALTER TABLE notification_history 
  MODIFY COLUMN notification_type 
    ENUM('month_before', '15_days_before', 'week_before', 'on_expiry_date', 'week_after') NOT NULL;