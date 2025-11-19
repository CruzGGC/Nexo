-- Allow any participant in a game room to update its state, not just the host
-- This enables guests (e.g., second player in TicTacToe) to persist their moves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_rooms'
      AND policyname = 'Participantes podem atualizar salas'
  ) THEN
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
  END IF;
END $$;
