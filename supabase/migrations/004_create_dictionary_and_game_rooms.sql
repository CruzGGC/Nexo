-- Migration: 004_create_dictionary_and_game_rooms.sql
-- Descrição: Cria tabela de dicionário português e salas de jogo multiplayer

-- Create Portuguese dictionary table
CREATE TABLE dictionary_pt (
  word TEXT PRIMARY KEY,
  definition TEXT, -- Definição para uso em pistas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para lookups e length queries
CREATE INDEX idx_dictionary_pt_word ON dictionary_pt(word);
CREATE INDEX idx_dictionary_pt_length ON dictionary_pt((length(word)));

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
  game_type game_type NOT NULL, -- Reutiliza o enum de scores
  players UUID[] NOT NULL DEFAULT '{}',
  game_state JSONB NOT NULL DEFAULT '{}',
  status game_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para active games
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_game_type ON game_rooms(game_type);
CREATE INDEX idx_game_rooms_status_type ON game_rooms(status, game_type);

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

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_game_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_game_rooms_updated_at
  BEFORE UPDATE ON game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_game_rooms_updated_at();

-- Comentários
COMMENT ON TABLE dictionary_pt IS 'Dicionário português para geração de puzzles';
COMMENT ON TABLE game_rooms IS 'Salas de jogo multiplayer para ambos os jogos';
COMMENT ON COLUMN game_rooms.game_type IS 'Tipo de jogo: crossword ou wordsearch';
COMMENT ON COLUMN game_rooms.game_state IS 'Estado atual do jogo (específico por tipo)';
