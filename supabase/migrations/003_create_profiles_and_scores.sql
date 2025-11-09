-- Migration: 003_create_profiles_and_scores.sql
-- Descrição: Cria tabelas de perfis e pontuações suportando ambos os jogos

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Create game type enum
CREATE TYPE game_type AS ENUM ('crossword', 'wordsearch');

-- Create scores table (suporta ambos os jogos)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  puzzle_id UUID NOT NULL, -- FK genérica (crosswords.id ou wordsearch.id)
  time_ms INTEGER NOT NULL CHECK (time_ms > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para leaderboard queries
CREATE INDEX idx_scores_game_type ON scores(game_type);
CREATE INDEX idx_scores_puzzle_id ON scores(puzzle_id);
CREATE INDEX idx_scores_time_ms ON scores(time_ms);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_game_puzzle ON scores(game_type, puzzle_id);

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Scores policies
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

-- View for crossword daily leaderboard
CREATE OR REPLACE VIEW crossword_daily_leaderboard AS
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
JOIN crosswords c ON s.puzzle_id = c.id
WHERE s.game_type = 'crossword'
  AND c.type = 'daily' 
  AND c.publish_date = CURRENT_DATE
ORDER BY s.time_ms ASC
LIMIT 10;

-- View for wordsearch daily leaderboard
CREATE OR REPLACE VIEW wordsearch_daily_leaderboard AS
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
JOIN wordsearch w ON s.puzzle_id = w.id
WHERE s.game_type = 'wordsearch'
  AND w.type = 'daily' 
  AND w.publish_date = CURRENT_DATE
ORDER BY s.time_ms ASC
LIMIT 10;

-- Grant access to the views
GRANT SELECT ON crossword_daily_leaderboard TO authenticated, anon;
GRANT SELECT ON wordsearch_daily_leaderboard TO authenticated, anon;

-- Function para atualizar updated_at de profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();
