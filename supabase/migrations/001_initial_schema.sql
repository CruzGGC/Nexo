-- Nexo Database Schema
-- Execute this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create puzzle types enum
CREATE TYPE puzzle_type AS ENUM ('daily', 'standard_pt');

-- Create puzzles table
CREATE TABLE puzzles (
  id SERIAL PRIMARY KEY,
  type puzzle_type NOT NULL,
  grid_data JSONB NOT NULL,
  clues JSONB NOT NULL,
  solutions JSONB NOT NULL,
  publish_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for daily puzzles
CREATE INDEX idx_puzzles_publish_date ON puzzles(publish_date);
CREATE INDEX idx_puzzles_type ON puzzles(type);

-- Enable Row Level Security
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Puzzles are viewable by everyone
CREATE POLICY "Puzzles are viewable by everyone"
  ON puzzles FOR SELECT
  USING (true);

-- Create scores table
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  puzzle_id INTEGER NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  time_ms INTEGER NOT NULL CHECK (time_ms > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX idx_scores_puzzle_id ON scores(puzzle_id);
CREATE INDEX idx_scores_time_ms ON scores(time_ms);
CREATE INDEX idx_scores_user_id ON scores(user_id);

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Scores policies
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create Portuguese dictionary table
CREATE TABLE dictionary_pt (
  word TEXT PRIMARY KEY
);

-- Index for word lookups
CREATE INDEX idx_dictionary_pt_word ON dictionary_pt(word);

-- Enable Row Level Security
ALTER TABLE dictionary_pt ENABLE ROW LEVEL SECURITY;

-- Dictionary is viewable by everyone
CREATE POLICY "Dictionary is viewable by everyone"
  ON dictionary_pt FOR SELECT
  USING (true);

-- Create game status enum
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'finished');

-- Create game_rooms table for multiplayer
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL,
  players UUID[] NOT NULL DEFAULT '{}',
  game_state JSONB NOT NULL DEFAULT '{}',
  status game_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active games
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_game_type ON game_rooms(game_type);

-- Enable Row Level Security
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Game rooms policies
CREATE POLICY "Game rooms are viewable by everyone"
  ON game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create game rooms"
  ON game_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Players can update their game rooms"
  ON game_rooms FOR UPDATE
  USING (auth.uid() = ANY(players));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- View for daily leaderboard (Top 10 fastest times for today's puzzle)
CREATE OR REPLACE VIEW daily_leaderboard AS
SELECT 
  s.id,
  s.user_id,
  p.username,
  p.avatar_url,
  s.time_ms,
  s.created_at,
  RANK() OVER (ORDER BY s.time_ms ASC) as rank
FROM scores s
JOIN profiles p ON s.user_id = p.id
JOIN puzzles pz ON s.puzzle_id = pz.id
WHERE pz.type = 'daily' 
  AND pz.publish_date = CURRENT_DATE
ORDER BY s.time_ms ASC
LIMIT 10;

-- Grant access to the view
GRANT SELECT ON daily_leaderboard TO authenticated, anon;
