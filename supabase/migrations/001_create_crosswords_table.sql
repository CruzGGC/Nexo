-- Migration: 001_create_crosswords_table.sql
-- Descrição: Cria tabela separada para puzzles de Palavras Cruzadas
-- Substitui a antiga tabela 'puzzles' com schema específico para crosswords

-- Enable UUID extension (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de palavras cruzadas
CREATE TABLE crosswords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'daily' ou 'random'
  grid_data JSONB NOT NULL, -- Cell[][] (estrutura do grid)
  clues JSONB NOT NULL, -- { across: Clue[], down: Clue[] }
  solutions JSONB, -- Opcional, para referência
  publish_date DATE, -- Data de publicação (para puzzles diários)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX idx_crosswords_type ON crosswords(type);
CREATE INDEX idx_crosswords_publish_date ON crosswords(publish_date DESC);
CREATE INDEX idx_crosswords_type_date ON crosswords(type, publish_date DESC);

-- Enable Row Level Security
ALTER TABLE crosswords ENABLE ROW LEVEL SECURITY;

-- Policies: Puzzles são públicos (viewable por todos)
CREATE POLICY "Crosswords are viewable by everyone"
  ON crosswords FOR SELECT
  USING (true);

-- Comentários sobre estrutura de dados
COMMENT ON TABLE crosswords IS 'Armazena puzzles de palavras cruzadas';
COMMENT ON COLUMN crosswords.type IS 'Tipo: daily (diário) ou random (aleatório)';
COMMENT ON COLUMN crosswords.grid_data IS 'Grid 2D com células: { value, correct, number, isBlack, row, col }';
COMMENT ON COLUMN crosswords.clues IS 'Pistas: { across: [{number, text, answer, startRow, startCol}], down: [...] }';
COMMENT ON COLUMN crosswords.publish_date IS 'Data de publicação (NULL para puzzles aleatórios)';

-- Constraint: Daily puzzles devem ter publish_date
ALTER TABLE crosswords ADD CONSTRAINT check_daily_has_date
  CHECK (type != 'daily' OR publish_date IS NOT NULL);

-- Constraint: Apenas um daily puzzle por data
CREATE UNIQUE INDEX idx_crosswords_daily_unique_date 
  ON crosswords(publish_date) 
  WHERE type = 'daily';

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_crosswords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_crosswords_updated_at
  BEFORE UPDATE ON crosswords
  FOR EACH ROW
  EXECUTE FUNCTION update_crosswords_updated_at();
