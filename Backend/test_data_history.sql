-- Insert test data into client_history table
INSERT INTO client_history (
    Original_Client_Id,
    First_Name,
    Last_Name,
    Image,
    Passport_No,
    Email,
    Country,
    Visa_approved_at,
    migrated_at,
    initial_period,
    Visa_period,
    Visa_expiry_date,
    Visa_extend_for,
    visa_source,
    Visa_type,
    Agent_id,
    Moved_At
) VALUES 
(47, 'John', 'Smith', 'john_profile.jpg', 'P123456', 'john.smith@email.com', 'UK', '2024-01-01', '2024-01-15', 1, 1, '2024-02-15', 0, 'DUBAI', '30 DAYS SINGLE ENTRY', 1, '2024-02-16'),
(48, 'Sarah', 'Johnson', 'sarah_profile.jpg', 'P789012', 'sarah.j@email.com', 'USA', '2024-02-01', '2024-02-15', 2, 2, '2024-04-15', 0, 'ABU DHABI', '60 DAYS MULTIPLE ENTRY', 2, '2024-04-16'),
(49, 'Mohammed', 'Ali', 'mohammed_profile.jpg', 'P345678', 'mohammed.a@email.com', 'UAE', '2024-03-01', '2024-03-15', 1, 2, '2024-05-15', 1, 'SHARJAH', '30 DAYS SINGLE ENTRY', 1, '2024-05-16'),
(50, 'Maria', 'Garcia', 'maria_profile.jpg', 'P901234', 'maria.g@email.com', 'Spain', '2024-04-01', '2024-04-15', 2, 2, '2024-06-15', 0, 'DUBAI', '60 DAYS SINGLE ENTRY', 3, '2024-06-16'),
(51, 'David', 'Wilson', 'david_profile.jpg', 'P567890', 'david.w@email.com', 'Canada', '2024-05-01', '2024-05-15', 1, 1, '2024-06-15', 0, 'RAS', '30 DAYS MULTIPLE ENTRY', 2, '2024-06-16');

-- Update the Moved_At timestamps to show different archival times
UPDATE client_history SET Moved_At = DATE_SUB(NOW(), INTERVAL 5 DAY) WHERE Original_Client_Id = 47;
UPDATE client_history SET Moved_At = DATE_SUB(NOW(), INTERVAL 4 DAY) WHERE Original_Client_Id = 48;
UPDATE client_history SET Moved_At = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE Original_Client_Id = 49;
UPDATE client_history SET Moved_At = DATE_SUB(NOW(), INTERVAL 2 DAY) WHERE Original_Client_Id = 50;
UPDATE client_history SET Moved_At = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE Original_Client_Id = 51;