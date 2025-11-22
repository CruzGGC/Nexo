-- Matchmaking RPC for transactional pairing and automatic room creation
CREATE OR REPLACE FUNCTION public.matchmaking_join_and_create_room(
  p_user_id uuid,
  p_game_type text,
  p_rating_snapshot integer,
  p_skill_bracket text,
  p_region text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_self matchmaking_queue%ROWTYPE;
  v_opponent matchmaking_queue%ROWTYPE;
  v_host matchmaking_queue%ROWTYPE;
  v_guest matchmaking_queue%ROWTYPE;
  v_host_meta jsonb := '{}'::jsonb;
  v_guest_meta jsonb := '{}'::jsonb;
  v_room game_rooms%ROWTYPE;
  v_room_code text := upper(encode(extensions.gen_random_bytes(3), 'hex'));
  v_match_code text;
  v_response jsonb;
  v_variant text;
  v_match_reason text := 'rpc';
  v_user_metadata jsonb := '{}'::jsonb;
  v_removed integer := 0;
  v_puzzle_id uuid;
BEGIN
  v_user_metadata := jsonb_strip_nulls(coalesce(p_metadata, '{}'::jsonb));
  v_match_code := upper(nullif(coalesce(v_user_metadata->>'matchCode', v_user_metadata->>'match_code'), ''));
  IF v_match_code IS NOT NULL THEN
    v_user_metadata := jsonb_set(v_user_metadata, '{matchCode}', to_jsonb(v_match_code), TRUE);
  END IF;

  -- Select appropriate puzzle ID based on game type
  -- For duel modes, we generate a new random UUID which will be populated by the host client
  v_puzzle_id := gen_random_uuid();

  -- remove stale queued entry for the same user/game
  DELETE FROM matchmaking_queue
  WHERE user_id = p_user_id
    AND game_type = p_game_type
    AND status = 'queued';
  GET DIAGNOSTICS v_removed = ROW_COUNT;
  RAISE NOTICE 'MM[%]: removed % stale queued entries for user %', p_game_type, v_removed, p_user_id;

  INSERT INTO matchmaking_queue (user_id, game_type, rating_snapshot, skill_bracket, region, status, metadata)
  VALUES (p_user_id, p_game_type, p_rating_snapshot, p_skill_bracket, p_region, 'queued', v_user_metadata)
  RETURNING * INTO v_self;
  RAISE NOTICE 'MM[%]: inserted queue entry %, mode %, seat %, match_code %', p_game_type, v_self.id, v_user_metadata->>'mode', v_user_metadata->>'seat', coalesce(v_match_code, 'auto');

  SELECT q.* INTO v_opponent
  FROM matchmaking_queue q
  WHERE q.game_type = p_game_type
    AND q.status = 'queued'
    AND q.id <> v_self.id
    AND (
      (v_match_code IS NOT NULL AND upper(nullif(coalesce(q.metadata->>'matchCode', q.metadata->>'match_code'), '')) = v_match_code)
      OR (v_match_code IS NULL AND nullif(coalesce(q.metadata->>'matchCode', q.metadata->>'match_code'), '') IS NULL)
    )
    AND NOT (
      coalesce(lower(q.metadata->>'seat'), '') <> ''
      AND coalesce(lower(v_user_metadata->>'seat'), '') <> ''
      AND lower(q.metadata->>'seat') = lower(v_user_metadata->>'seat')
    )
  ORDER BY q.joined_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE 'MM[%]: no opponent found for entry %, mode %, match_code %', p_game_type, v_self.id, v_user_metadata->>'mode', coalesce(v_match_code, 'auto');
    v_response := jsonb_build_object(
      'status', 'queued',
      'queue_entry', to_jsonb(v_self)
    );
    RETURN v_response;
  END IF;

  RAISE NOTICE 'MM[%]: opponent % found for entry % (self seat %, opponent seat %)', p_game_type, v_opponent.id, v_self.id, v_self.metadata->>'seat', v_opponent.metadata->>'seat';

  v_host := v_self;
  v_guest := v_opponent;

  IF lower(coalesce(v_self.metadata->>'seat', '')) = 'guest' AND lower(coalesce(v_opponent.metadata->>'seat', '')) <> 'guest' THEN
    v_host := v_opponent;
    v_guest := v_self;
  ELSIF lower(coalesce(v_self.metadata->>'seat', '')) <> 'host' AND lower(coalesce(v_opponent.metadata->>'seat', '')) = 'host' THEN
    v_host := v_opponent;
    v_guest := v_self;
  ELSIF v_self.joined_at > v_opponent.joined_at THEN
    v_host := v_opponent;
    v_guest := v_self;
  END IF;

  v_host_meta := jsonb_strip_nulls(coalesce(v_host.metadata, '{}'::jsonb));
  v_guest_meta := jsonb_strip_nulls(coalesce(v_guest.metadata, '{}'::jsonb));
  v_variant := coalesce(v_host_meta->>'variant', v_guest_meta->>'variant', 'casual');
  IF v_match_code IS NOT NULL THEN
    v_match_reason := 'private-code';
  END IF;
  RAISE NOTICE 'MM[%]: creating room code % host % guest % variant % reason %', p_game_type, v_room_code, v_host.user_id, v_guest.user_id, v_variant, v_match_reason;
  INSERT INTO game_rooms (host_id, game_type, puzzle_id, game_state, status, max_players)
  VALUES (
    v_host.user_id,
    p_game_type,
    v_puzzle_id,
    jsonb_build_object(
      'room_code', v_room_code,
      'phase', 'preparação',
      'variant', v_variant,
      'match_reason', v_match_reason,
      'participants', jsonb_build_array(
        jsonb_build_object('id', v_host.user_id, 'role', 'host', 'marker', 'X', 'ready', FALSE),
        jsonb_build_object('id', v_guest.user_id, 'role', 'guest', 'marker', 'O', 'ready', FALSE)
      )
    ),
    'waiting',
    2
  )
  RETURNING * INTO v_room;

  UPDATE matchmaking_queue
  SET status = 'matched',
      matched_at = v_now,
      metadata = jsonb_strip_nulls(
        coalesce(metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'room_id', v_room.id,
          'room_code', v_room_code,
          'match_reason', v_match_reason,
          'role', 'host',
          'opponent_id', v_guest.user_id,
          'symbol', 'X'
        )
      )
  WHERE id = v_host.id
  RETURNING * INTO v_host;
      RAISE NOTICE 'MM[%]: host entry % updated with room %', p_game_type, v_host.id, v_room.id;

  UPDATE matchmaking_queue
  SET status = 'matched',
      matched_at = v_now,
      metadata = jsonb_strip_nulls(
        coalesce(metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'room_id', v_room.id,
          'room_code', v_room_code,
          'match_reason', v_match_reason,
          'role', 'guest',
          'opponent_id', v_host.user_id,
          'symbol', 'O'
        )
      )
  WHERE id = v_guest.id
  RETURNING * INTO v_guest;
  RAISE NOTICE 'MM[%]: guest entry % updated with room %', p_game_type, v_guest.id, v_room.id;

  v_response := jsonb_build_object(
    'status', 'matched',
    'room', to_jsonb(v_room),
    'queue_entry', CASE WHEN v_self.id = v_host.id THEN to_jsonb(v_host) ELSE to_jsonb(v_guest) END,
    'opponent_entry', CASE WHEN v_self.id = v_host.id THEN to_jsonb(v_guest) ELSE to_jsonb(v_host) END
  );
  RAISE NOTICE 'MM[%]: returning response status % (queue %, opponent %)', p_game_type, v_response->>'status', (v_response->'queue_entry'->>'id'), (v_response->'opponent_entry'->>'id');

  RETURN v_response;
END;
$$;

COMMENT ON FUNCTION public.matchmaking_join_and_create_room IS 'Transactional matchmaking RPC that enqueues players, pairs compatible opponents, and creates a game room instantly.';

GRANT EXECUTE ON FUNCTION public.matchmaking_join_and_create_room TO authenticated;
GRANT EXECUTE ON FUNCTION public.matchmaking_join_and_create_room TO anon;

-- ============================================================================
-- CLAIM VICTORY RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_victory(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room game_rooms%ROWTYPE;
  v_user_id UUID := auth.uid();
  v_is_participant BOOLEAN;
  v_current_progress JSONB;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id;
  
  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if already finished
  IF v_room.finished_at IS NOT NULL THEN
    RETURN; -- Already finished, do nothing
  END IF;

  -- Check participation
  -- Host is always a participant, but check array too for consistency
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(coalesce(v_room.game_state->'participants', '[]'::jsonb)) AS p
    WHERE (p->>'id')::uuid = v_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant AND v_room.host_id != v_user_id THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  -- Get current progress to preserve other player's progress
  v_current_progress := coalesce(v_room.game_state->'progress', '{}'::jsonb);

  -- Update room atomically
  UPDATE game_rooms
  SET 
    status = 'finished',
    finished_at = NOW(),
    game_state = v_room.game_state || jsonb_build_object(
      'winner_id', v_user_id,
      'progress', v_current_progress || jsonb_build_object(v_user_id::text, 100)
    )
  WHERE id = p_room_id AND finished_at IS NULL;
END;
$$;

