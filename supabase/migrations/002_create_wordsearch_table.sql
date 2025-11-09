-- Migration: 002_create_wordsearch_table.sql
-- Descrição: Cria tabela separada para puzzles de Sopa de Letras
-- Schema específico para word search puzzles

-- Criar tabela de sopa de letras
CREATE TABLE wordsearch (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'daily' ou 'random'
  grid_data JSONB NOT NULL, -- string[][] (matriz de letras 15x15)
  words JSONB NOT NULL, -- WordPlacement[] (palavras escondidas)
  size INTEGER NOT NULL DEFAULT 15, -- Tamanho do grid (15x15)
  publish_date DATE, -- Data de publicação (para puzzles diários)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX idx_wordsearch_type ON wordsearch(type);
CREATE INDEX idx_wordsearch_publish_date ON wordsearch(publish_date DESC);
CREATE INDEX idx_wordsearch_type_date ON wordsearch(type, publish_date DESC);

-- Enable Row Level Security
ALTER TABLE wordsearch ENABLE ROW LEVEL SECURITY;

-- Policies: Puzzles são públicos (viewable por todos)
CREATE POLICY "Wordsearch puzzles are viewable by everyone"
  ON wordsearch FOR SELECT
  USING (true);

-- Comentários sobre estrutura de dados
COMMENT ON TABLE wordsearch IS 'Armazena puzzles de sopa de letras';
COMMENT ON COLUMN wordsearch.type IS 'Tipo: daily (diário) ou random (aleatório)';
COMMENT ON COLUMN wordsearch.grid_data IS 'Grid 2D de letras: string[][]';
COMMENT ON COLUMN wordsearch.words IS 'Palavras escondidas: [{ word, definition, startRow, startCol, direction }]';
COMMENT ON COLUMN wordsearch.size IS 'Dimensão do grid (padrão 15x15)';
COMMENT ON COLUMN wordsearch.publish_date IS 'Data de publicação (NULL para puzzles aleatórios)';

-- Constraint: Daily puzzles devem ter publish_date
ALTER TABLE wordsearch ADD CONSTRAINT check_daily_has_date
  CHECK (type != 'daily' OR publish_date IS NOT NULL);

-- Constraint: Apenas um daily puzzle por data
CREATE UNIQUE INDEX idx_wordsearch_daily_unique_date 
  ON wordsearch(publish_date) 
  WHERE type = 'daily';

-- Constraint: Size deve ser entre 10 e 25
ALTER TABLE wordsearch ADD CONSTRAINT check_size_range
  CHECK (size >= 10 AND size <= 25);

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_wordsearch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_wordsearch_updated_at
  BEFORE UPDATE ON wordsearch
  FOR EACH ROW
  EXECUTE FUNCTION update_wordsearch_updated_at();
