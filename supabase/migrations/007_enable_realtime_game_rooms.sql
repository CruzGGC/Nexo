-- Ensure game_rooms emits realtime events so both players receive moves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'game_rooms'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms';
  END IF;
END $$;

-- Realtime requires replicas to include the full row for JSON state diffs
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
