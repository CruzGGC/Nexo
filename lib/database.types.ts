// Generated TypeScript types for Supabase tables
// This file will be auto-generated once you set up your Supabase project
// For now, this contains the planned schema types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      puzzles: {
        Row: {
          id: number
          type: 'daily' | 'standard_pt'
          grid_data: Json
          clues: Json
          solutions: Json
          publish_date: string | null
          created_at: string
        }
        Insert: {
          id?: number
          type: 'daily' | 'standard_pt'
          grid_data: Json
          clues: Json
          solutions: Json
          publish_date?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          type?: 'daily' | 'standard_pt'
          grid_data?: Json
          clues?: Json
          solutions?: Json
          publish_date?: string | null
          created_at?: string
        }
      }
      scores: {
        Row: {
          id: number
          user_id: string
          puzzle_id: number
          time_ms: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          puzzle_id: number
          time_ms: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          puzzle_id?: number
          time_ms?: number
          created_at?: string
        }
      }
      dictionary_pt: {
        Row: {
          word: string
        }
        Insert: {
          word: string
        }
        Update: {
          word?: string
        }
      }
      game_rooms: {
        Row: {
          id: string
          game_type: string
          players: string[]
          game_state: Json
          status: 'waiting' | 'in_progress' | 'finished'
          created_at: string
        }
        Insert: {
          id?: string
          game_type: string
          players: string[]
          game_state: Json
          status?: 'waiting' | 'in_progress' | 'finished'
          created_at?: string
        }
        Update: {
          id?: string
          game_type?: string
          players?: string[]
          game_state?: Json
          status?: 'waiting' | 'in_progress' | 'finished'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      puzzle_type: 'daily' | 'standard_pt'
      game_status: 'waiting' | 'in_progress' | 'finished'
    }
  }
}
