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

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Crypto helpers (guest tags, secure defaults)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Cron jobs (para geração diária de puzzles)
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- HTTP requests (para chamar Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Criar schema do Vault (necessário para instalar a extensão)
CREATE SCHEMA IF NOT EXISTS vault;

-- Secrets Vault (para pg_cron + Edge Functions)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'supabase_vault'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault';
  ELSE
    RAISE NOTICE 'Extensão supabase_vault indisponível nesta instância. Use app_private.runtime_secrets como fallback até configurar o Vault.';
  END IF;
END $$;

-- =========================================================================
-- 1.1 SECRET STORAGE DE FALLBACK (app_private)
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO postgres;
GRANT USAGE ON SCHEMA app_private TO supabase_admin;

CREATE TABLE IF NOT EXISTS app_private.runtime_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE app_private.runtime_secrets IS 'Fallback local para segredos enquanto o Vault não está disponível';
COMMENT ON COLUMN app_private.runtime_secrets.name IS 'Identificador único do segredo (ex: project_url)';
COMMENT ON COLUMN app_private.runtime_secrets.value IS 'Valor armazenado temporariamente (mantido apenas lado servidor)';

REVOKE ALL ON TABLE app_private.runtime_secrets FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_private.runtime_secrets TO supabase_admin;

CREATE OR REPLACE FUNCTION app_private.get_secret(p_name TEXT, p_required BOOLEAN DEFAULT false)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, app_private
AS $$
DECLARE
  v_value TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'vault'
      AND table_name = 'decrypted_secrets'
  ) THEN
    SELECT decrypted_secret
    INTO v_value
    FROM vault.decrypted_secrets
    WHERE name = p_name
    LIMIT 1;
  END IF;

  IF v_value IS NULL THEN
    SELECT value
    INTO v_value
    FROM app_private.runtime_secrets
    WHERE name = p_name;
  END IF;

  IF p_required AND v_value IS NULL THEN
    RAISE EXCEPTION 'Secret "%" não configurado. Use o Vault (supabase_vault) ou a tabela app_private.runtime_secrets.', p_name;
  END IF;

  RETURN v_value;
END;
$$;

COMMENT ON FUNCTION app_private.get_secret IS 'Obtém segredo do Vault (quando disponível) ou do fallback app_private.runtime_secrets';

-- ============================================================================
-- 2. TABELAS BASE (sem Foreign Keys)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PROFILES - Perfis de utilizadores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  display_name TEXT NOT NULL DEFAULT 'Convidado' CHECK (char_length(display_name) >= 3 AND char_length(display_name) <= 32),
  avatar_url TEXT,
  country_code TEXT CHECK (char_length(country_code) = 2),
  experience_points INTEGER NOT NULL DEFAULT 0 CHECK (experience_points >= 0),
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  guest_tag TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(3), 'hex'),
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfis públicos dos utilizadores';
COMMENT ON COLUMN profiles.username IS 'Nome único visível (3-20 caracteres)';
COMMENT ON COLUMN profiles.user_id IS 'Referência ao auth.users da Supabase';
COMMENT ON COLUMN profiles.display_name IS 'Nome apresentado publicamente (pode repetir)';
COMMENT ON COLUMN profiles.country_code IS 'Código de país ISO 3166-1 alpha-2';
COMMENT ON COLUMN profiles.experience_points IS 'XP obtido em jogos singleplayer/multiplayer';
COMMENT ON COLUMN profiles.is_anonymous IS 'Flag sincronizada com auth.users.is_anonymous';
COMMENT ON COLUMN profiles.guest_tag IS 'Identificador curto para partilha em lobbies';
COMMENT ON COLUMN profiles.preferences IS 'Configurações e preferências em JSON';

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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('crossword', 'wordsearch', 'crossword_duel', 'wordsearch_duel', 'tic_tac_toe', 'battleship')),
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

-- ----------------------------------------------------------------------------
-- 3.6 PLAYER_RATINGS - Elo/Glicko por tipo de jogo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_ratings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('crossword', 'wordsearch', 'crossword_duel', 'wordsearch_duel', 'tic_tac_toe', 'battleship')),
  rating NUMERIC NOT NULL DEFAULT 1500 CHECK (rating >= 0),
  deviation NUMERIC NOT NULL DEFAULT 350 CHECK (deviation >= 30 AND deviation <= 350),
  volatility NUMERIC NOT NULL DEFAULT 0.06 CHECK (volatility > 0 AND volatility < 1),
  matches_played INTEGER NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  win_rate NUMERIC NOT NULL DEFAULT 0 CHECK (win_rate >= 0 AND win_rate <= 1),
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_type)
);

COMMENT ON TABLE player_ratings IS 'Ratings ELO/Glicko por utilizador e tipo de jogo';
COMMENT ON COLUMN player_ratings.deviation IS 'Incerteza do rating (Glicko RD)';

-- ----------------------------------------------------------------------------
-- 3.7 MATCHMAKING_QUEUE - Fila de emparelhamento tempo real
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('tic_tac_toe', 'battleship', 'crossword_duel', 'wordsearch_duel')),
  rating_snapshot INTEGER NOT NULL CHECK (rating_snapshot >= 0),
  skill_bracket TEXT NOT NULL,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'matched', 'cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_at TIMESTAMPTZ,
  CONSTRAINT matchmaking_queue_owner_unique UNIQUE (user_id, game_type, status)
);

COMMENT ON TABLE matchmaking_queue IS 'Entradas ativas/recente da fila de matchmaking';
COMMENT ON COLUMN matchmaking_queue.skill_bracket IS 'Bucket simplificado para procura rápida';

-- ============================================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_anonymous ON profiles(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC);

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

-- Player Ratings
CREATE INDEX IF NOT EXISTS idx_player_ratings_game ON player_ratings(game_type, rating DESC);
CREATE INDEX IF NOT EXISTS idx_player_ratings_updated ON player_ratings(updated_at DESC);

-- Matchmaking Queue
CREATE INDEX IF NOT EXISTS idx_queue_status_game ON matchmaking_queue(status, game_type, joined_at);
CREATE INDEX IF NOT EXISTS idx_queue_user ON matchmaking_queue(user_id);

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

CREATE POLICY "Participantes podem atualizar salas"
  ON game_rooms FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = host_id
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(coalesce(game_state->'participants', '[]'::jsonb)) AS participant
        WHERE participant->>'id' = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = host_id
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(coalesce(game_state->'participants', '[]'::jsonb)) AS participant
        WHERE participant->>'id' = auth.uid()::text
      )
    )
  );

-- Realtime configuration
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER TABLE game_rooms REPLICA IDENTITY FULL;

CREATE POLICY "Hosts podem deletar próprias salas"
  ON game_rooms FOR DELETE
  USING (auth.uid() = host_id);

-- ----------------------------------------------------------------------------
-- 5.9 PLAYER_RATINGS - Leitura pública, escrita pelo próprio
-- ----------------------------------------------------------------------------
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings públicos para leitura"
  ON player_ratings FOR SELECT
  USING (true);

CREATE POLICY "Utilizadores criam rating inicial"
  ON player_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores atualizam próprio rating"
  ON player_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores removem próprio rating"
  ON player_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5.10 MATCHMAKING_QUEUE - Gestão pelo próprio utilizador
-- ----------------------------------------------------------------------------
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fila pública para leitura"
  ON matchmaking_queue FOR SELECT
  USING (true);

CREATE POLICY "Jogadores entram na fila"
  ON matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Jogadores atualizam entrada"
  ON matchmaking_queue FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Jogadores removem entrada"
  ON matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

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
  p.display_name,
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
  p.display_name,
  p.avatar_url,
  ROW_NUMBER() OVER (PARTITION BY s.puzzle_id ORDER BY s.time_ms ASC) as rank
FROM scores s
INNER JOIN profiles p ON s.user_id = p.user_id
WHERE s.game_type = 'wordsearch'
ORDER BY s.puzzle_id, s.time_ms ASC;

COMMENT ON VIEW leaderboard_wordsearches IS 'Ranking de sopa de letras ordenado por tempo';

-- ----------------------------------------------------------------------------
-- 6.4 VIEW: leaderboard_player_ratings
-- Ranking global por jogo usando player_ratings
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW leaderboard_player_ratings AS
SELECT 
  r.game_type,
  r.rating,
  r.deviation,
  r.matches_played,
  r.win_rate,
  p.username,
  p.display_name,
  p.avatar_url,
  ROW_NUMBER() OVER (PARTITION BY r.game_type ORDER BY r.rating DESC) as rank
FROM player_ratings r
INNER JOIN profiles p ON r.user_id = p.user_id
ORDER BY r.game_type, r.rating DESC;

COMMENT ON VIEW leaderboard_player_ratings IS 'Ranking Elo/Glicko por tipo de jogo';

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
DECLARE
  v_username TEXT;
  v_display_name TEXT;
  v_preferences JSONB;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || substring(NEW.id::text, 1, 8)
  );

  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    v_username
  );

  v_preferences := COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb);

  INSERT INTO public.profiles (
    user_id,
    username,
    display_name,
    avatar_url,
    country_code,
    is_anonymous,
    preferences
  )
  VALUES (
    NEW.id,
    v_username,
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.is_anonymous, true),
    v_preferences
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions;

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
  RAISE NOTICE '📊 Tabelas: profiles, dictionary_pt, word_categories, dictionary_categories, crosswords, wordsearches, scores, game_rooms, player_ratings, matchmaking_queue';
  RAISE NOTICE '🔐 RLS ativado em todas as tabelas';
  RAISE NOTICE '📈 Índices otimizados criados';
  RAISE NOTICE '👁️ Views: words_with_categories, leaderboard_crosswords, leaderboard_wordsearches';
  RAISE NOTICE '⚡ Triggers: updated_at, create_profile';
  RAISE NOTICE '🔧 Functions: get_daily_crossword, get_daily_wordsearch';
END $$;