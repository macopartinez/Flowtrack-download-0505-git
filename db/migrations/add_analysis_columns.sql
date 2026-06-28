-- Add analysis-related columns to app_users table
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS followers_count INTEGER,
ADD COLUMN IF NOT EXISTS following_count INTEGER,
ADD COLUMN IF NOT EXISTS posts_count INTEGER,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN,
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP;

-- Create index on analysis_status for faster queries
CREATE INDEX IF NOT EXISTS idx_users_analysis_status ON app_users(analysis_status);
CREATE INDEX IF NOT EXISTS idx_users_last_analyzed_at ON app_users(last_analyzed_at);
