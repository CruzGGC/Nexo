-- Migration: Add definitions to Portuguese dictionary
-- This allows automatic crossword generation with clues

-- Add definition column to dictionary_pt
ALTER TABLE dictionary_pt ADD COLUMN IF NOT EXISTS definition TEXT;

-- Create index on word length for better query performance
CREATE INDEX IF NOT EXISTS idx_dictionary_pt_word_length ON dictionary_pt((length(word)));

-- Update the comment
COMMENT ON TABLE dictionary_pt IS 'Portuguese (PT-PT) dictionary with words and their definitions for automatic crossword generation';
COMMENT ON COLUMN dictionary_pt.word IS 'Portuguese word (lowercase, normalized)';
COMMENT ON COLUMN dictionary_pt.definition IS 'Definition or clue for the word';
