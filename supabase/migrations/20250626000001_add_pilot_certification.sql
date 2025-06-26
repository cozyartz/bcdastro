/*
  # Add pilot certification fields to users table

  1. Changes
    - Add `part_107_certified` column to users table with default value false
    - Add `certification_number` column to users table
    - Update handle_new_user function to include pilot cert fields

  2. Security
    - Only affects the users table structure
    - Pilot certification status will be used for content validation
*/

-- Add pilot certification columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'part_107_certified'
  ) THEN
    ALTER TABLE users ADD COLUMN part_107_certified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'certification_number'
  ) THEN
    ALTER TABLE users ADD COLUMN certification_number text;
  END IF;
END $$;

-- Update the handle_new_user function to include pilot certification fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url, part_107_certified, certification_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'pilot_cert_number') IS NOT NULL, false),
    NEW.raw_user_meta_data->>'pilot_cert_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;