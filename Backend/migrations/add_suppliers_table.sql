CREATE TABLE suppliers IF NOT EXISTS (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact VARCHAR(50),
    contact_person VARCHAR(100) NOT NULL,
    contact_email VARCHAR(20),
    contact_number VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

 company_name,                       
                , 
                contact, 
                contact_person, 
                , 
                ,
                status 