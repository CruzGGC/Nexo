export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      crosswords: {
        Row: {
          category_id: string | null
          clues: Json
          created_at: string
          grid_data: Json
          id: string
          publish_date: string | null
          quality_score: number | null
          solutions: Json
          type: 'daily' | 'random' | 'custom'
        }
        Insert: {
          category_id?: string | null
          clues: Json
          created_at?: string
          grid_data: Json
          id?: string
          publish_date?: string | null
          quality_score?: number | null
          solutions?: Json
          type: 'daily' | 'random' | 'custom'
        }
        Update: {
          category_id?: string | null
          clues?: Json
          created_at?: string
          grid_data?: Json
          id?: string
          publish_date?: string | null
          quality_score?: number | null
          solutions?: Json
          type?: 'daily' | 'random' | 'custom'
        }
        Relationships: [
          {
            foreignKeyName: 'crosswords_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'word_categories'
            referencedColumns: ['id']
          }
        ]
      }
      dictionary_categories: {
        Row: {
          category_id: string
          created_at: string
          word: string
        }
        Insert: {
          category_id: string
          created_at?: string
          word: string
        }
        Update: {
          category_id?: string
          created_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dictionary_categories_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'word_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dictionary_categories_word_fkey'
            columns: ['word']
            referencedRelation: 'dictionary_pt'
            referencedColumns: ['word']
          }
        ]
      }
      dictionary_pt: {
        Row: {
          created_at: string
          definition: string
          word: string
        }
        Insert: {
          created_at?: string
          definition: string
          word: string
        }
        Update: {
          created_at?: string
          definition?: string
          word?: string
        }
        Relationships: []
      }
      game_rooms: {
        Row: {
          created_at: string
          finished_at: string | null
          game_state: Json
          game_type: 'crossword' | 'wordsearch'
          host_id: string
          id: string
          max_players: number
          puzzle_id: string
          started_at: string | null
          status: 'waiting' | 'playing' | 'finished'
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          game_state?: Json
          game_type: 'crossword' | 'wordsearch'
          host_id: string
          id?: string
          max_players?: number
          puzzle_id: string
          started_at?: string | null
          status?: 'waiting' | 'playing' | 'finished'
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          game_state?: Json
          game_type?: 'crossword' | 'wordsearch'
          host_id?: string
          id?: string
          max_players?: number
          puzzle_id?: string
          started_at?: string | null
          status?: 'waiting' | 'playing' | 'finished'
        }
        Relationships: [
          {
            foreignKeyName: 'game_rooms_host_id_fkey'
            columns: ['host_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      scores: {
        Row: {
          completed_at: string
          game_type: 'crossword' | 'wordsearch'
          id: string
          puzzle_id: string
          time_ms: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          game_type: 'crossword' | 'wordsearch'
          id?: string
          puzzle_id: string
          time_ms: number
          user_id: string
        }
        Update: {
          completed_at?: string
          game_type?: 'crossword' | 'wordsearch'
          id?: string
          puzzle_id?: string
          time_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scores_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      word_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      wordsearches: {
        Row: {
          category_id: string | null
          created_at: string
          grid_data: Json
          id: string
          publish_date: string | null
          size: number
          type: 'daily' | 'random' | 'custom'
          words: Json
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          grid_data: Json
          id?: string
          publish_date?: string | null
          size: number
          type: 'daily' | 'random' | 'custom'
          words: Json
        }
        Update: {
          category_id?: string | null
          created_at?: string
          grid_data?: Json
          id?: string
          publish_date?: string | null
          size?: number
          type?: 'daily' | 'random' | 'custom'
          words?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'wordsearches_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'word_categories'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      leaderboard_crosswords: {
        Row: {
          avatar_url: string | null
          completed_at: string | null
          puzzle_id: string | null
          rank: number | null
          time_ms: number | null
          username: string | null
        }
        Relationships: []
      }
      leaderboard_wordsearches: {
        Row: {
          avatar_url: string | null
          completed_at: string | null
          puzzle_id: string | null
          rank: number | null
          time_ms: number | null
          username: string | null
        }
        Relationships: []
      }
      words_with_categories: {
        Row: {
          categories: Json | null
          created_at: string | null
          definition: string | null
          word: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_daily_crossword: {
        Args: {
          target_date?: string | null
        }
        Returns: {
          category_id: string | null
          clues: Json
          created_at: string | null
          grid_data: Json
          id: string | null
          is_fallback: boolean | null
          publish_date: string | null
          quality_score: number | null
          solutions: Json
          type: string | null
        }[]
      }
      get_daily_wordsearch: {
        Args: {
          target_date?: string | null
        }
        Returns: {
          category_id: string | null
          created_at: string | null
          grid_data: Json
          id: string | null
          is_fallback: boolean | null
          publish_date: string | null
          size: number | null
          type: string | null
          words: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
