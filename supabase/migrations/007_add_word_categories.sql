-- Migration: 007_add_word_categories.sql
-- Descrição: Adiciona sistema de categorias para palavras do dicionário
-- Permite criar jogos temáticos (desporto, comida, natureza, etc.)

-- Create categories table
CREATE TABLE word_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (ex: 'desporto')
  name TEXT NOT NULL, -- Display name (ex: 'Desporto')
  description TEXT, -- Category description
  icon TEXT, -- Emoji or icon identifier
  color TEXT, -- Hex color for UI (#FF5733)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create many-to-many relationship table
CREATE TABLE dictionary_categories (
  word TEXT NOT NULL REFERENCES dictionary_pt(word) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES word_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (word, category_id)
);

-- Indexes for performance
CREATE INDEX idx_dictionary_categories_word ON dictionary_categories(word);
CREATE INDEX idx_dictionary_categories_category ON dictionary_categories(category_id);
CREATE INDEX idx_word_categories_slug ON word_categories(slug);

-- Enable Row Level Security
ALTER TABLE word_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Categories are viewable by everyone"
  ON word_categories FOR SELECT
  USING (true);

CREATE POLICY "Dictionary categories are viewable by everyone"
  ON dictionary_categories FOR SELECT
  USING (true);

-- Insert default categories
INSERT INTO word_categories (slug, name, description, icon, color) VALUES
('geral', 'Geral', 'Palavras de uso comum no dia-a-dia', '📝', '#6B7280'),
('animais', 'Animais', 'Fauna e criaturas do reino animal', '🐾', '#10B981'),
('comida', 'Comida e Bebidas', 'Alimentos, pratos e bebidas', '🍽️', '#F59E0B'),
('desporto', 'Desporto', 'Desportos, atletas e competições', '⚽', '#3B82F6'),
('natureza', 'Natureza', 'Plantas, paisagens e elementos naturais', '🌿', '#10B981'),
('corpo', 'Corpo Humano', 'Partes do corpo e anatomia', '🫀', '#EF4444'),
('casa', 'Casa e Lar', 'Objetos domésticos e mobiliário', '🏠', '#8B5CF6'),
('viagem', 'Viagem e Transportes', 'Veículos, destinos e turismo', '✈️', '#06B6D4'),
('profissoes', 'Profissões', 'Carreiras e ocupações', '💼', '#F97316'),
('tecnologia', 'Tecnologia', 'Informática, gadgets e inovação', '💻', '#6366F1'),
('arte', 'Arte e Cultura', 'Expressões artísticas e culturais', '🎨', '#EC4899'),
('musica', 'Música', 'Instrumentos, géneros e compositores', '🎵', '#A855F7'),
('ciencia', 'Ciência', 'Conceitos científicos e descobertas', '🔬', '#14B8A6'),
('geografia', 'Geografia', 'Países, cidades e acidentes geográficos', '🗺️', '#0EA5E9'),
('historia', 'História', 'Eventos históricos e personalidades', '📚', '#92400E'),
('emocoes', 'Emoções', 'Sentimentos e estados emocionais', '❤️', '#F43F5E'),
('tempo', 'Tempo e Clima', 'Meteorologia e estações', '🌤️', '#38BDF8'),
('cores', 'Cores', 'Tonalidades e pigmentos', '🎨', '#EC4899'),
('numeros', 'Números e Matemática', 'Conceitos numéricos e operações', '🔢', '#8B5CF6'),
('portugal', 'Portugal', 'Cultura e tradições portuguesas', '🇵🇹', '#DC2626');

-- Add comment
COMMENT ON TABLE word_categories IS 'Categorias temáticas para organização de palavras';
COMMENT ON TABLE dictionary_categories IS 'Relação many-to-many entre palavras e categorias';

-- View útil: palavras com suas categorias
CREATE VIEW words_with_categories AS
SELECT 
  d.word,
  d.definition,
  ARRAY_AGG(wc.slug ORDER BY wc.name) as category_slugs,
  ARRAY_AGG(wc.name ORDER BY wc.name) as category_names,
  ARRAY_AGG(wc.icon ORDER BY wc.name) as category_icons
FROM dictionary_pt d
LEFT JOIN dictionary_categories dc ON d.word = dc.word
LEFT JOIN word_categories wc ON dc.category_id = wc.id
GROUP BY d.word, d.definition;

COMMENT ON VIEW words_with_categories IS 'View consolidada de palavras com suas categorias';
