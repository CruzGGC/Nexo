import type { RoomGameState } from '@/components/BattleshipGame'
import type { QueueStatus } from '@/hooks/useMatchmaking'

interface MatchmakingPanelProps {
  status: QueueStatus
  generatedCode: string
  inviteCode: string
  onGeneratedCodeChange: (value: string) => void
  onInviteCodeChange: (value: string) => void
  onJoinPublic: () => Promise<void> | void
  onCreatePrivate: () => Promise<void> | void
  onJoinWithCode: () => Promise<void> | void
  onLeaveQueue: () => Promise<void> | void
  hasQueueEntry: boolean
  roomState: RoomGameState | null
  roomId?: string
  roomStatus?: string
}

export function MatchmakingPanel({
  status,
  generatedCode,
  inviteCode,
  onGeneratedCodeChange,
  onInviteCodeChange,
  onJoinPublic,
  onCreatePrivate,
  onJoinWithCode,
  onLeaveQueue,
  hasQueueEntry,
  roomId,
  roomStatus,
  roomState
}: MatchmakingPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Matchmaking Supabase</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">Fila global + código privado</p>

      <div className="mt-4 space-y-4">
        <button
          type="button"
          onClick={onJoinPublic}
          disabled={status === 'queued' || status === 'joining'}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-offset-2 transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          ⚡ Entrar no Emparelhamento Público
        </button>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sala Privada</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gera um código e partilha com um amigo, ou insere o código recebido para entrar.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                value={generatedCode}
                onChange={event => onGeneratedCodeChange(event.target.value.toUpperCase())}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase tracking-[0.4em] text-slate-900 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={onCreatePrivate}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                Criar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={inviteCode}
                onChange={event => onInviteCodeChange(event.target.value.toUpperCase())}
                placeholder="Código"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase tracking-[0.4em] text-slate-900 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={onJoinWithCode}
                className="rounded-xl border border-indigo-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
        {hasQueueEntry && (
          <button
            type="button"
            onClick={onLeaveQueue}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar procura
          </button>
        )}
      </div>

      {roomId && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Sala em direto</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{roomId}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jogadores: {roomState?.participants?.length ?? 2} • Estado: {roomStatus ?? 'pending'}
          </p>
        </div>
      )}
    </div>
  )
}
