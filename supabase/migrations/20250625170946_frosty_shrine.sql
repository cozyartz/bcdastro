/*
  # Add admin column to users table

  1. Changes
    - Add `is_admin` column to users table with default value false
    - This allows us to designate admin users who can manage the platform

  2. Security
    - Only affects the users table structure
    - Admin privileges will be checked in application logic
*/

-- Add is_admin column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;