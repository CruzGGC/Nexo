'use client'

import { useMemo, useState } from 'react'
import { autoPlaceFleet, toggleTargetCell, type BattleshipBoard } from '@/lib/games/battleship'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { generateMatchCode } from '@/lib/matchmaking'

const GRID_SIZE = 10

type TargetCell = '' | 'pending' | 'hit' | 'miss'

type RoomGameState = {
  room_code?: string
  phase?: string
  participants?: Array<{ id: string; display_name?: string; ready?: boolean }>
}

function buildTargetBoard(): TargetCell[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('')) as TargetCell[][]
}

function extractState(value: unknown): RoomGameState | null {
  if (value && typeof value === 'object') {
    return value as RoomGameState
  }
  return null
}

const statusMessages: Record<string, string> = {
  idle: 'Disponível para jogar',
  joining: 'A preparar entrada na fila…',
  queued: 'À espera de adversário…',
  matched: 'Sala encontrada! Sincroniza o tabuleiro…',
  error: 'Ops! Algo correu mal'
}

export default function BattleshipGame() {
  const [placement, setPlacement] = useState(() => autoPlaceFleet(GRID_SIZE))
  const [targetBoard, setTargetBoard] = useState(() => buildTargetBoard())
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState(generateMatchCode())
  const [showShips, setShowShips] = useState(true)

  const { status, room, joinQueue, leaveQueue, queueEntry } = useMatchmaking('battleship')

  const playerFleet = useMemo(() => placement.ships, [placement])

  const handleShuffle = () => {
    setPlacement(autoPlaceFleet(GRID_SIZE))
  }

  const handleTargetClick = (row: number, col: number) => {
    setTargetBoard(prev => {
      const snapshot = prev.map(line => [...line])
      const nextValue = toggleTargetCell(snapshot[row][col] || 'pending')
      snapshot[row][col] = nextValue
      return snapshot
    })
  }

  const handleJoinPublic = async () => {
    await joinQueue({ mode: 'public', metadata: { fleet_ready: true } })
  }

  const handleCreatePrivate = async () => {
    const code = generatedCode || generateMatchCode()
    setGeneratedCode(code)
    await joinQueue({ mode: 'private', matchCode: code, seat: 'host', metadata: { fleet_ready: true } })
  }

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) return
    await joinQueue({ mode: 'private', matchCode: inviteCode.trim().toUpperCase(), seat: 'guest', metadata: { fleet_ready: true } })
  }

  const currentStatus = statusMessages[status] ?? statusMessages.idle
  const roomState = extractState(room?.game_state)
  const metadataState = extractState(queueEntry?.metadata)
  const roomCode = roomState?.room_code ?? metadataState?.room_code
  const phase = roomState?.phase ?? 'placement'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-black dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900/80">
          <div className="absolute inset-0 opacity-50 blur-3xl">
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-sky-200 via-blue-200 to-indigo-200 dark:from-sky-500/30 dark:via-blue-500/20 dark:to-indigo-500/30" />
          </div>
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-sky-100/70 px-4 py-1 text-sm font-semibold text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">
                🚢 Batalha Naval 1v1 • Matchmaking + Código Privado
              </p>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl">
                Domina o Atlântico digital com animações e matchmaking Supabase
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Coloca a frota, partilha um código privado ou entra na fila global. O worker `matchmaking-worker` trata do emparelhamento e abre uma sala segura em segundos.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-slate-200/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Tabuleiro 10x10 • Frota clássica
                </span>
                <span className="rounded-full border border-slate-200/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Estados em tempo real via Realtime
                </span>
                <span className="rounded-full border border-slate-200/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Private code + modo público
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 text-sm text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Estado</p>
              <p className="mt-2 text-2xl font-semibold">{currentStatus}</p>
              {roomCode && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Código da sala: <span className="font-mono text-lg text-sky-500 dark:text-sky-300">{roomCode}</span>
                </p>
              )}
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Fase atual: <span className="font-semibold capitalize text-slate-800 dark:text-white">{phase}</span>
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Frota pronta</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vista estratégica</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  🔁 Reorganizar Frota
                </button>
                <button
                  type="button"
                  onClick={() => setShowShips(!showShips)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {showShips ? '🙈 Esconder Navios' : '👀 Revelar Navios'}
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Oceano Aliado
                </p>
                <BattleshipBoardView board={placement.ocean} reveal={showShips} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Radar Ofensivo
                </p>
                <TargetBoardView board={targetBoard} onClick={handleTargetClick} />
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Marca tiros certeiros (laranja) e falhados (magenta) para acompanhar padrões enquanto o adversário responde.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              {playerFleet.map(ship => (
                <div
                  key={ship.code}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">{ship.name}</p>
                  <p className="mt-2 text-2xl text-slate-900 dark:text-white">{ship.cells.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">células</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Matchmaking Supabase</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">Fila global + código privado</p>

              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={handleJoinPublic}
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
                        onChange={event => setGeneratedCode(event.target.value.toUpperCase())}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase tracking-[0.4em] text-slate-900 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreatePrivate}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
                      >
                        Criar
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={inviteCode}
                        onChange={event => setInviteCode(event.target.value.toUpperCase())}
                        placeholder="Código"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase tracking-[0.4em] text-slate-900 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleJoinWithCode}
                        className="rounded-xl border border-indigo-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                </div>
                {queueEntry && (
                  <button
                    type="button"
                    onClick={leaveQueue}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar procura
                  </button>
                )}
              </div>

              {room && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Sala em direto</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{room.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jogadores: {roomState?.participants?.length ?? 2} • Estado: {room.status}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-xl dark:border-indigo-500/20 dark:from-indigo-900/30 dark:via-slate-900 dark:to-cyan-900/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Plano de tiro</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li>• Marca combinações em X padrão para descobrir rapidamente a frota adversária.</li>
                <li>• Alterna entre tiros horizontais e verticais para confirmar navios longos.</li>
                <li>• Reúne o código da sala para convidar interinos enquanto o worker cron reforça a fila pública.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function BattleshipBoardView({ board, reveal }: { board: BattleshipBoard; reveal: boolean }) {
  return (
    <div className="grid grid-cols-10 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isShip = cell !== '~'
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                isShip && reveal
                  ? 'bg-sky-500/80 text-white shadow-inner'
                  : 'bg-white text-slate-400 dark:bg-slate-800'
              } dark:text-white`}
            >
              {isShip && reveal ? cell : ''}
            </div>
          )
        })
      )}
    </div>
  )
}

function TargetBoardView({
  board,
  onClick
}: {
  board: TargetCell[][]
  onClick: (row: number, col: number) => void
}) {
  return (
    <div className="grid grid-cols-10 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <button
            type="button"
            key={`${rowIndex}-${colIndex}`}
            onClick={() => onClick(rowIndex, colIndex)}
            className={`h-8 w-8 rounded-lg text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
              cell === 'hit'
                ? 'bg-amber-400 text-white'
                : cell === 'miss'
                  ? 'bg-fuchsia-400 text-white'
                  : cell === 'pending'
                    ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-white text-slate-400 dark:bg-slate-800'
            }`}
          >
            {cell === 'hit' ? '•' : cell === 'miss' ? '×' : ''}
          </button>
        ))
      )}
    </div>
  )
}
