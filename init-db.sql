-- This file runs automatically when MySQL container starts for the first time
-- It ensures the database exists and sets proper permissions

-- Make sure the database exists
CREATE DATABASE IF NOT EXISTS accountdb;

-- Set proper authentication method for root user
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'root';

-- Grant all privileges to root for remote connections
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;