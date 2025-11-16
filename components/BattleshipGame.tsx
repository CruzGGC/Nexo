'use client'

import { useState } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { generateMatchCode } from '@/lib/matchmaking'
import { BattleshipHero } from '@/components/battleship/BattleshipHero'
import { MatchmakingPanel } from '@/components/battleship/MatchmakingPanel'
import { useBattleshipBoards } from '@/hooks/useBattleshipBoards'
import { FleetPanel } from '@/components/battleship/FleetPanel'
import { TargetPanel } from '@/components/battleship/TargetPanel'

export type RoomGameState = {
  room_code?: string
  phase?: string
  participants?: Array<{ id: string; display_name?: string; ready?: boolean }>
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
  const { ocean, playerFleet, targetBoard, showShips, shuffleFleet, toggleFleetVisibility, handleTargetClick } = useBattleshipBoards()
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState(generateMatchCode())

  const { status, room, joinQueue, leaveQueue, queueEntry } = useMatchmaking('battleship')

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

  const handleGeneratedCodeChange = (value: string) => {
    setGeneratedCode(value)
  }

  const handleInviteCodeChange = (value: string) => {
    setInviteCode(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-black dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <BattleshipHero statusMessage={currentStatus} roomCode={roomCode} phase={phase} />

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
                  onClick={shuffleFleet}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  🔁 Reorganizar Frota
                </button>
                <button
                  type="button"
                  onClick={toggleFleetVisibility}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {showShips ? '🙈 Esconder Navios' : '👀 Revelar Navios'}
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FleetPanel board={ocean} showShips={showShips} />
              <TargetPanel board={targetBoard} onCellClick={handleTargetClick} />
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
            <MatchmakingPanel
              status={status}
              generatedCode={generatedCode}
              inviteCode={inviteCode}
              onGeneratedCodeChange={handleGeneratedCodeChange}
              onInviteCodeChange={handleInviteCodeChange}
              onJoinPublic={handleJoinPublic}
              onCreatePrivate={handleCreatePrivate}
              onJoinWithCode={handleJoinWithCode}
              onLeaveQueue={leaveQueue}
              hasQueueEntry={Boolean(queueEntry)}
              roomId={room?.id}
              roomStatus={room?.status}
              roomState={roomState}
            />

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
