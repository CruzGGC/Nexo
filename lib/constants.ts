/**
 * Constantes centralizadas do Nexo
 * 
 * Este ficheiro centraliza todos os "magic numbers", timeouts, limites e
 * feature flags que estavam espalhados pelo código.
 * 
 * Organização:
 * - TIMING: Delays, timeouts, intervalos
 * - GRID: Dimensões de grelhas de jogos
 * - GAME: Limites e configurações de jogos
 * - MATCHMAKING: Configurações de matchmaking
 * - API: Timeouts e limites de API
 * - UI: Configurações de animação e UI
 * - FEATURE_FLAGS: Features habilitáveis/desabilitáveis
 */

// ============================================================================
// TIMING - Delays, Timeouts e Intervalos
// ============================================================================

export const TIMING = {
  /** Intervalo do timer de jogo (10ms para precisão de centésimos) */
  TIMER_INTERVAL_MS: 10,
  
  /** Delay após completar um puzzle antes de mostrar resultados */
  COMPLETION_DELAY_MS: 1000,
  
  /** Duração do confetti após vitória */
  CONFETTI_DURATION_MS: 5000,
  
  /** Delay para iniciar animação de rating */
  RATING_ANIMATION_DELAY_MS: 500,
  
  /** Duração de mensagens de feedback (toasts) */
  FEEDBACK_MESSAGE_DURATION_MS: 3000,
  
  /** Delay entre tentativas de reconexão ao realtime */
  REALTIME_RETRY_DELAY_MS: 1500,
  
  /** Intervalo de polling quando realtime falha (8s para reduzir carga do servidor) */
  QUEUE_POLL_INTERVAL_MS: 8000,
  
  /** Delay antes de verificar match após join */
  MATCH_CHECK_DELAY_MS: 1200,
  
  /** Debounce para atualizações de presença */
  PRESENCE_DEBOUNCE_MS: 100,
  
  /** Timeout padrão para transições/animações */
  DEFAULT_TRANSITION_MS: 200,
} as const

// ============================================================================
// GRID - Dimensões de Grelhas
// ============================================================================

export const GRID = {
  /** Tamanho padrão da grelha de palavras cruzadas */
  CROSSWORD_SIZE: 15,
  
  /** Tamanho padrão da grelha de sopa de letras */
  WORDSEARCH_SIZE: 15,
  
  /** Tamanho mínimo de palavra para palavras cruzadas */
  CROSSWORD_MIN_WORD_LENGTH: 3,
  
  /** Tamanho máximo de palavra para palavras cruzadas */
  CROSSWORD_MAX_WORD_LENGTH: 10,
  
  /** Tamanho mínimo de palavra para sopa de letras */
  WORDSEARCH_MIN_WORD_LENGTH: 4,
  
  /** Tamanho máximo de palavra para sopa de letras */
  WORDSEARCH_MAX_WORD_LENGTH: 12,
  
  /** Grelha da batalha naval */
  BATTLESHIP_SIZE: 10,
  
  /** Grelha do jogo do galo */
  TICTACTOE_SIZE: 3,
} as const

// ============================================================================
// GAME - Configurações de Jogos
// ============================================================================

export const GAME = {
  /** Máximo de palavras por puzzle de palavras cruzadas */
  CROSSWORD_MAX_WORDS: 10,
  
  /** Máximo de palavras por puzzle de sopa de letras */
  WORDSEARCH_MAX_WORDS: 10,
  
  /** Multiplicador de palavras para filtragem (ex: 10 * 3 = 30 candidatas) */
  CROSSWORD_WORD_POOL_MULTIPLIER: 3,
  
  /** Tentativas máximas de geração de puzzle */
  MAX_GENERATION_ATTEMPTS: 5,
  
  /** Navios na batalha naval: { nome: tamanho } */
  BATTLESHIP_SHIPS: {
    'Porta-aviões': 5,
    'Navio de Guerra': 4,
    'Cruzador': 3,
    'Submarino': 3,
    'Destroyer': 2,
  } as const,
  
  /** Total de tiros necessários para afundar todos os navios */
  BATTLESHIP_TOTAL_HITS: 17, // 5 + 4 + 3 + 3 + 2
} as const

// ============================================================================
// MATCHMAKING - Configurações de Matchmaking
// ============================================================================

export const MATCHMAKING = {
  /** Timeout para RPC de matchmaking */
  RPC_TIMEOUT_MS: 10000,
  
  /** Tempo máximo de espera na queue antes de timeout */
  QUEUE_TIMEOUT_MS: 300000, // 5 minutos
  
  /** Intervalo de heartbeat para presença */
  PRESENCE_HEARTBEAT_MS: 30000, // 30 segundos
  
  /** Diferença máxima de rating para match */
  RATING_RANGE: 200,
  
  /** Rating inicial para novos jogadores */
  DEFAULT_RATING: 1000,
  
  /** K-factor para cálculo de Elo */
  ELO_K_FACTOR: 32,
  
  /** Tamanho máximo do código de sala privada */
  PRIVATE_CODE_LENGTH: 6,
} as const

// ============================================================================
// API - Configurações de API
// ============================================================================

export const API = {
  /** Timeout padrão para fetch */
  FETCH_TIMEOUT_MS: 30000,
  
  /** Limite de resultados para leaderboards */
  LEADERBOARD_LIMIT: 10,
  
  /** Limite de puzzles recentes na página inicial */
  RECENT_PUZZLES_LIMIT: 5,
  
  /** Limite de resultados de pesquisa */
  SEARCH_RESULTS_LIMIT: 20,
  
  /** Timeout para Edge Functions */
  EDGE_FUNCTION_TIMEOUT_MS: 60000,
} as const

// ============================================================================
// UI - Configurações de Interface
// ============================================================================

export const UI = {
  /** Duração padrão de animações (Framer Motion) */
  ANIMATION_DURATION: 0.2,
  
  /** Duração de transições de página */
  PAGE_TRANSITION_DURATION: 0.3,
  
  /** Easing padrão para animações */
  ANIMATION_EASING: [0.4, 0, 0.2, 1] as const,
  
  /** Z-index para modais */
  MODAL_Z_INDEX: 50,
  
  /** Z-index para navbar */
  NAVBAR_Z_INDEX: 40,
  
  /** Breakpoints (deve corresponder ao Tailwind) */
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  } as const,
} as const

// ============================================================================
// FEATURE FLAGS - Features habilitáveis
// ============================================================================

export const FEATURE_FLAGS = {
  /** Habilitar modo multiplayer (batalha naval, jogo do galo) */
  MULTIPLAYER_ENABLED: true,
  
  /** Habilitar autenticação anónima */
  ANONYMOUS_AUTH_ENABLED: true,
  
  /** Habilitar Google OAuth */
  GOOGLE_AUTH_ENABLED: true,
  
  /** Mostrar estatísticas detalhadas no perfil */
  DETAILED_STATS_ENABLED: true,
  
  /** Habilitar notificações PWA */
  PWA_NOTIFICATIONS_ENABLED: false,
  
  /** Habilitar modo debug (logs extras) */
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  
  /** Habilitar leaderboards públicos */
  PUBLIC_LEADERBOARDS_ENABLED: true,
} as const

// ============================================================================
// COLORS - Cores do tema (para uso em JS quando CSS não é possível)
// ============================================================================

export const COLORS = {
  /** Background principal */
  background: '#030014',
  
  /** Accent ciano (neon) */
  accentCyan: '#00f3ff',
  
  /** Accent roxo (neon) */
  accentPurple: '#bc13fe',
  
  /** Glass background */
  glass: 'rgba(255, 255, 255, 0.05)',
  
  /** Border glass */
  glassBorder: 'rgba(255, 255, 255, 0.1)',
} as const

// ============================================================================
// Type exports
// ============================================================================

export type BattleshipShipName = keyof typeof GAME.BATTLESHIP_SHIPS
export type UIBreakpoint = keyof typeof UI.BREAKPOINTS
