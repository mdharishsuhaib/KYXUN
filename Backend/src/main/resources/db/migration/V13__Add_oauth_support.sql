-- V13: Add OAuth support

ALTER TABLE users
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'LOCAL' NOT NULL;

-- Allow password to be null for Google Sign-In users
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;
