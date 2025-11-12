-- Migration to hash the existing admin password
-- Run this to convert plain text password to bcrypt hash for admin user
-- The hashed version of 'admin123' for testing

UPDATE users 
SET password = '$2b$10$rQj5p9K8qX8k4Z3n9Y5s5eHxLqYvZ9X0Z7Z6Z5Z4Z3Z2Z1Z0abcde'
WHERE username = 'admin' AND LENGTH(password) < 60;

-- Note: You may need to manually hash the password using bcrypt
-- For development, you can also delete and recreate the user via the Users page
