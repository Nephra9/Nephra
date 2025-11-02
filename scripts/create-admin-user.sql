-- Create Admin User Setup Script
-- Run this in your Supabase SQL Editor to create an admin user

-- Method 1: Update existing user to admin role
-- Replace 'your-email@example.com' with the email of the user you want to make admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Method 2: Create a new admin user (if you need to create one from scratch)
-- First, you'll need to sign up with this email through the app, then run the update above

-- Method 3: Check current users and their roles
SELECT id, email, full_name, role, status, created_at 
FROM users 
ORDER BY created_at DESC;

-- Method 4: Make the first user an admin (if you're the first user)
UPDATE users 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Verify the admin user was created/updated
SELECT id, email, full_name, role, status 
FROM users 
WHERE role = 'admin';
