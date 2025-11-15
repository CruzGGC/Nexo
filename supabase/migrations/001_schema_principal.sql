-- ============================================================================
-- NEXO - Schema Principal Consolidado
-- ============================================================================
-- Este ficheiro cria todas as tabelas, índices, policies RLS e funções
-- necessárias para o funcionamento do Nexo (PWA de jogos portugueses)
--
-- VERSÃO: 2.0.1 (Corrigido)
-- DATA: 13 Novembro 2025
--
-- CORREÇÕES (v2.0.1):
-- - Fixed: Syntax error com UNIQUE constraints parciais (WHERE clause)
-- - Solução: Movido constraints UNIQUE com WHERE para CREATE UNIQUE INDEX separado
-- - Referência: PostgreSQL docs - Partial Unique Indexes
--
-- SEGURANÇA:
-- - Row Level Security (RLS) ativado em todas as tabelas sensíveis
-- - Políticas restritivas por defeito
-- - Constraints de integridade referencial com CASCADE apropriado
-- - Índices otimizados para queries frequentes
--
-- ORDEM DE EXECUÇÃO:
-- 1. Extensions
-- 2. Tabelas base (sem FK)
-- 3. Tabelas com FK
-- 4. Índices (incluindo índices únicos parciais)
-- 5. RLS Policies
-- 6. Triggers e Functions
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cron jobs (para geração diária de puzzles)
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- HTTP requests (para chamar Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ============================================================================
-- 2. TABELAS BASE (sem Foreign Keys)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PROFILES - Perfis de utilizadores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfis públicos dos utilizadores';
COMMENT ON COLUMN profiles.username IS 'Nome único visível (3-20 caracteres)';
COMMENT ON COLUMN profiles.user_id IS 'Referência ao auth.users da Supabase';

-- ----------------------------------------------------------------------------
-- 2.2 DICTIONARY_PT - Dicionário de palavras portuguesas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictionary_pt (
  word TEXT PRIMARY KEY CHECK (char_length(word) >= 2 AND char_length(word) <= 15),
  definition TEXT NOT NULL CHECK (char_length(definition) >= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE dictionary_pt IS 'Dicionário de palavras portuguesas para puzzles';
COMMENT ON COLUMN dictionary_pt.word IS 'Palavra em minúsculas normalizada';
COMMENT ON COLUMN dictionary_pt.definition IS 'Definição usada como pista nos puzzles';

-- ----------------------------------------------------------------------------
-- 2.3 WORD_CATEGORIES - Categorias temáticas de palavras
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  description TEXT,
  icon TEXT NOT NULL CHECK (char_length(icon) <= 10),
  color TEXT NOT NULL CHECK (color ~ '^#[0-9A-F]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE word_categories IS 'Categorias temáticas para filtrar jogos';
COMMENT ON COLUMN word_categories.slug IS 'Identificador URL-friendly (lowercase, hyphens)';
COMMENT ON COLUMN word_categories.color IS 'Cor hexadecimal para UI (#RRGGBB)';

-- ============================================================================
-- 3. TABELAS COM FOREIGN KEYS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 DICTIONARY_CATEGORIES - Many-to-many: palavras <-> categorias
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictionary_categories (
  word TEXT NOT NULL REFERENCES dictionary_pt(word) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES word_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (word, category_id)
);

COMMENT ON TABLE dictionary_categories IS 'Relação N:N entre palavras e categorias';

-- ----------------------------------------------------------------------------
-- 3.2 CROSSWORDS - Puzzles de palavras cruzadas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crosswords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('daily', 'random', 'custom')),
  category_id UUID REFERENCES word_categories(id) ON DELETE SET NULL,
  grid_data JSONB NOT NULL,
  clues JSONB NOT NULL,
  solutions JSONB NOT NULL DEFAULT '{}',
  quality_score SMALLINT CHECK (quality_score >= 0 AND quality_score <= 100),
  publish_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único parcial: apenas 1 puzzle diário por dia
CREATE UNIQUE INDEX unique_daily_crossword ON crosswords (type, publish_date) 
  WHERE type = 'daily';

COMMENT ON TABLE crosswords IS 'Puzzles de palavras cruzadas gerados';
COMMENT ON COLUMN crosswords.type IS 'daily=puzzle do dia, random=gerado on-demand, custom=criado por user';
COMMENT ON COLUMN crosswords.quality_score IS 'Score 0-100 baseado em intersecções e densidade';
COMMENT ON COLUMN crosswords.publish_date IS 'Data de publicação (apenas para type=daily)';

-- ----------------------------------------------------------------------------
-- 3.3 WORDSEARCHES - Puzzles de sopa de letras
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wordsearches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('daily', 'random', 'custom')),
  category_id UUID REFERENCES word_categories(id) ON DELETE SET NULL,
  grid_data JSONB NOT NULL,
  words JSONB NOT NULL,
  size SMALLINT NOT NULL CHECK (size >= 8 AND size <= 20),
  publish_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único parcial: apenas 1 puzzle diário por dia
CREATE UNIQUE INDEX unique_daily_wordsearch ON wordsearches (type, publish_date) 
  WHERE type = 'daily';

COMMENT ON TABLE wordsearches IS 'Puzzles de sopa de letras gerados';
COMMENT ON COLUMN wordsearches.size IS 'Dimensão do grid (NxN)';

-- ----------------------------------------------------------------------------
-- 3.4 SCORES - Pontuações dos jogadores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('crossword', 'wordsearch')),
  puzzle_id UUID NOT NULL,
  time_ms INTEGER NOT NULL CHECK (time_ms > 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Evitar duplicados: 1 score por user por puzzle
  CONSTRAINT unique_user_puzzle UNIQUE (user_id, game_type, puzzle_id)
);

COMMENT ON TABLE scores IS 'Pontuações dos jogadores nos puzzles';
COMMENT ON COLUMN scores.time_ms IS 'Tempo de conclusão em milissegundos';
COMMENT ON COLUMN scores.game_type IS 'Tipo de puzzle (crossword ou wordsearch)';

-- ----------------------------------------------------------------------------
-- 3.5 GAME_ROOMS - Salas de jogo multiplayer (futuro)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('crossword', 'wordsearch')),
  puzzle_id UUID NOT NULL,
  game_state JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players SMALLINT NOT NULL DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  
  -- Constraint: datas lógicas
  CONSTRAINT valid_game_timeline CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (finished_at IS NULL OR finished_at >= started_at)
  )
);

COMMENT ON TABLE game_rooms IS 'Salas de jogo multiplayer (implementação futura)';

-- ============================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Dictionary
CREATE INDEX IF NOT EXISTS idx_dictionary_word_length ON dictionary_pt(char_length(word));

-- Dictionary Categories (many-to-many)
CREATE INDEX IF NOT EXISTS idx_dict_cat_word ON dictionary_categories(word);
CREATE INDEX IF NOT EXISTS idx_dict_cat_category ON dictionary_categories(category_id);

-- Crosswords
CREATE INDEX IF NOT EXISTS idx_crosswords_type ON crosswords(type);
CREATE INDEX IF NOT EXISTS idx_crosswords_publish_date ON crosswords(publish_date) WHERE type = 'daily';
CREATE INDEX IF NOT EXISTS idx_crosswords_category ON crosswords(category_id);

-- Wordsearches
CREATE INDEX IF NOT EXISTS idx_wordsearches_type ON wordsearches(type);
CREATE INDEX IF NOT EXISTS idx_wordsearches_publish_date ON wordsearches(publish_date) WHERE type = 'daily';
CREATE INDEX IF NOT EXISTS idx_wordsearches_category ON wordsearches(category_id);

-- Scores (leaderboards)
CREATE INDEX IF NOT EXISTS idx_scores_puzzle ON scores(game_type, puzzle_id, time_ms);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_completed_at ON scores(completed_at DESC);

-- Game Rooms
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status) WHERE status != 'finished';
CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON game_rooms(host_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 PROFILES - Leitura pública, escrita apenas próprio perfil
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis públicos para leitura"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Utilizadores podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir perfis"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5.2 DICTIONARY_PT - Leitura pública, escrita apenas admin
-- ----------------------------------------------------------------------------
ALTER TABLE dictionary_pt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dicionário público para leitura"
  ON dictionary_pt FOR SELECT
  USING (true);

-- Nota: Escrita apenas via SQL direto ou função admin (não via API pública)

-- ----------------------------------------------------------------------------
-- 5.3 WORD_CATEGORIES - Leitura pública
-- ----------------------------------------------------------------------------
ALTER TABLE word_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias públicas para leitura"
  ON word_categories FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 5.4 DICTIONARY_CATEGORIES - Leitura pública
-- ----------------------------------------------------------------------------
ALTER TABLE dictionary_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relações públicas para leitura"
  ON dictionary_categories FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 5.5 CROSSWORDS - Leitura pública
-- ----------------------------------------------------------------------------
ALTER TABLE crosswords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puzzles públicos para leitura"
  ON crosswords FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 5.6 WORDSEARCHES - Leitura pública
-- ----------------------------------------------------------------------------
ALTER TABLE wordsearches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puzzles públicos para leitura"
  ON wordsearches FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 5.7 SCORES - Leitura pública, escrita apenas próprios scores
-- ----------------------------------------------------------------------------
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores públicos para leitura"
  ON scores FOR SELECT
  USING (true);

CREATE POLICY "Utilizadores podem inserir próprios scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem deletar próprios scores"
  ON scores FOR DELETE
  USING (auth.uid() = user_id);

-- Nota: UPDATE bloqueado (scores são imutáveis)

-- ----------------------------------------------------------------------------
-- 5.8 GAME_ROOMS - Acesso baseado em participação
-- ----------------------------------------------------------------------------
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salas públicas para leitura"
  ON game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Hosts podem criar salas"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts podem atualizar próprias salas"
  ON game_rooms FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts podem deletar próprias salas"
  ON game_rooms FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================================================
-- 6. VIEWS OTIMIZADAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 VIEW: words_with_categories
-- Agrega palavras com suas categorias em JSON
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW words_with_categories AS
SELECT 
  d.word,
  d.definition,
  d.created_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', wc.id,
        'slug', wc.slug,
        'name', wc.name,
        'icon', wc.icon,
        'color', wc.color
      ) ORDER BY wc.name
    ) FILTER (WHERE wc.id IS NOT NULL),
    '[]'::jsonb
  ) as categories
FROM dictionary_pt d
LEFT JOIN dictionary_categories dc ON d.word = dc.word
LEFT JOIN word_categories wc ON dc.category_id = wc.id
GROUP BY d.word, d.definition, d.created_at;

COMMENT ON VIEW words_with_categories IS 'Palavras agregadas com suas categorias em JSON';

-- ----------------------------------------------------------------------------
-- 6.2 VIEW: leaderboard_crosswords
-- Top scores de palavras cruzadas (cache-friendly)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW leaderboard_crosswords AS
SELECT 
  s.puzzle_id,
  s.time_ms,
  s.completed_at,
  p.username,
  p.avatar_url,
  ROW_NUMBER() OVER (PARTITION BY s.puzzle_id ORDER BY s.time_ms ASC) as rank
FROM scores s
INNER JOIN profiles p ON s.user_id = p.user_id
WHERE s.game_type = 'crossword'
ORDER BY s.puzzle_id, s.time_ms ASC;

COMMENT ON VIEW leaderboard_crosswords IS 'Ranking de palavras cruzadas ordenado por tempo';

-- ----------------------------------------------------------------------------
-- 6.3 VIEW: leaderboard_wordsearches
-- Top scores de sopa de letras
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW leaderboard_wordsearches AS
SELECT 
  s.puzzle_id,
  s.time_ms,
  s.completed_at,
  p.username,
  p.avatar_url,
  ROW_NUMBER() OVER (PARTITION BY s.puzzle_id ORDER BY s.time_ms ASC) as rank
FROM scores s
INNER JOIN profiles p ON s.user_id = p.user_id
WHERE s.game_type = 'wordsearch'
ORDER BY s.puzzle_id, s.time_ms ASC;

COMMENT ON VIEW leaderboard_wordsearches IS 'Ranking de sopa de letras ordenado por tempo';

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 TRIGGER: updated_at automático
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7.2 TRIGGER: criar profile ao registar user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substring(NEW.id::text, 1, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- ============================================================================
-- 8. FUNÇÕES AUXILIARES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 FUNCTION: get_daily_crossword
-- Retorna puzzle diário de palavras cruzadas (com fallback)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_daily_crossword(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  id UUID,
  type TEXT,
  category_id UUID,
  grid_data JSONB,
  clues JSONB,
  solutions JSONB,
  quality_score SMALLINT,
  publish_date DATE,
  created_at TIMESTAMPTZ,
  is_fallback BOOLEAN
) AS $$
BEGIN
  -- Tentar buscar puzzle do dia exato
  RETURN QUERY
  SELECT 
    c.id, c.type, c.category_id, c.grid_data, c.clues, c.solutions,
    c.quality_score, c.publish_date, c.created_at,
    false as is_fallback
  FROM crosswords c
  WHERE c.type = 'daily' AND c.publish_date = target_date
  LIMIT 1;
  
  -- Se não encontrou, retornar puzzle mais recente
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      c.id, c.type, c.category_id, c.grid_data, c.clues, c.solutions,
      c.quality_score, c.publish_date, c.created_at,
      true as is_fallback
    FROM crosswords c
    WHERE c.type = 'daily' AND c.publish_date < target_date
    ORDER BY c.publish_date DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_daily_crossword IS 'Busca puzzle diário com fallback para dia anterior';

-- ----------------------------------------------------------------------------
-- 8.2 FUNCTION: get_daily_wordsearch
-- Retorna puzzle diário de sopa de letras (com fallback)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_daily_wordsearch(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  id UUID,
  type TEXT,
  category_id UUID,
  grid_data JSONB,
  words JSONB,
  size SMALLINT,
  publish_date DATE,
  created_at TIMESTAMPTZ,
  is_fallback BOOLEAN
) AS $$
BEGIN
  -- Tentar buscar puzzle do dia exato
  RETURN QUERY
  SELECT 
    w.id, w.type, w.category_id, w.grid_data, w.words, w.size,
    w.publish_date, w.created_at,
    false as is_fallback
  FROM wordsearches w
  WHERE w.type = 'daily' AND w.publish_date = target_date
  LIMIT 1;
  
  -- Se não encontrou, retornar puzzle mais recente
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      w.id, w.type, w.category_id, w.grid_data, w.words, w.size,
      w.publish_date, w.created_at,
      true as is_fallback
    FROM wordsearches w
    WHERE w.type = 'daily' AND w.publish_date < target_date
    ORDER BY w.publish_date DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_daily_wordsearch IS 'Busca puzzle diário com fallback para dia anterior';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Schema do Nexo criado com sucesso!';
  RAISE NOTICE '📊 Tabelas: profiles, dictionary_pt, word_categories, dictionary_categories, crosswords, wordsearches, scores, game_rooms';
  RAISE NOTICE '🔐 RLS ativado em todas as tabelas';
  RAISE NOTICE '📈 Índices otimizados criados';
  RAISE NOTICE '👁️ Views: words_with_categories, leaderboard_crosswords, leaderboard_wordsearches';
  RAISE NOTICE '⚡ Triggers: updated_at, create_profile';
  RAISE NOTICE '🔧 Functions: get_daily_crossword, get_daily_wordsearch';
END $$;