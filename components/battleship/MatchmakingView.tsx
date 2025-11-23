import { useState } from 'react'
import { generateMatchCode } from '@/lib/matchmaking'
import { motion } from 'framer-motion'

interface MatchmakingViewProps {
  onJoinPublic: () => void
  onCreatePrivate: (code: string) => void
  onJoinPrivate: (code: string) => void
  onCancel: () => void
  status: string
  roomCode?: string
}

export function MatchmakingView({
  onJoinPublic,
  onCreatePrivate,
  onJoinPrivate,
  onCancel,
  status,
  roomCode
}: MatchmakingViewProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState(generateMatchCode())
  const [view, setView] = useState<'menu' | 'create' | 'join'>('menu')

  const isSearching = status === 'queued' || status === 'joining' || status === 'matched'

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center gap-12 py-12">
        <div className="text-center space-y-8">
          <div className="relative mx-auto h-48 w-48">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20"></div>
            <div className="absolute inset-0 animate-[spin_4s_linear_infinite] rounded-full border-t-2 border-cyan-500/50"></div>
            <div className="absolute inset-4 animate-[spin_3s_linear_infinite_reverse] rounded-full border-b-2 border-purple-500/50"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <span className="text-6xl animate-pulse">📡</span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {status === 'matched' ? 'ALVO LOCALIZADO!' : 'A RASTREAR...'}
            </h2>
            <p className="text-slate-400">
              {status === 'matched'
                ? 'A iniciar protocolos de combate...'
                : 'A procurar sinal de frota inimiga...'}
            </p>
          </div>

          {roomCode && (
            <div className="inline-block rounded-xl bg-white/5 px-6 py-3 font-mono text-xl tracking-widest border border-white/10 text-cyan-400">
              CANAL: {roomCode}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            onCancel()
          }}
          className="rounded-full border border-white/10 px-8 py-3 text-sm font-bold tracking-wider text-slate-400 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
        >
          CANCELAR RASTREIO
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white tracking-tight">MODO ONLINE</h2>
        <p className="text-slate-400">
          Escolhe o teu método de conexão.
        </p>
      </div>

      {view === 'menu' && (
        <div className="grid gap-6 w-full max-w-md">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              onJoinPublic()
            }}
            className="group flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            <div className="rounded-xl bg-cyan-500/10 p-4 text-3xl group-hover:scale-110 transition-transform">🌍</div>
            <div>
              <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">Procurar Jogo</h3>
              <p className="text-sm text-slate-400">Matchmaking global rápido.</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              setView('create')
            }}
            className="group flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
          >
            <div className="rounded-xl bg-purple-500/10 p-4 text-3xl group-hover:scale-110 transition-transform">🔑</div>
            <div>
              <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">Criar Sala Privada</h3>
              <p className="text-sm text-slate-400">Gera um código de acesso.</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              setView('join')
            }}
            className="group flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          >
            <div className="rounded-xl bg-emerald-500/10 p-4 text-3xl group-hover:scale-110 transition-transform">👋</div>
            <div>
              <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">Entrar com Código</h3>
              <p className="text-sm text-slate-400">Usa um código de convite.</p>
            </div>
          </motion.button>

          <button
            onClick={() => {
              onCancel()
            }}
            className="mt-4 text-sm font-bold text-slate-500 hover:text-white transition-colors"
          >
            VOLTAR AO MENU
          </button>
        </div>
      )}

      {view === 'create' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">Sala Privada</h3>
            <p className="mt-2 text-sm text-slate-400">Partilha este código com o teu oponente.</p>
          </div>

          <div className="flex items-center justify-center gap-4 rounded-2xl bg-black/30 p-6 border border-white/5">
            <code className="text-4xl font-mono font-bold tracking-[0.2em] text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              {generatedCode}
            </code>
            <button
              onClick={() => {
                setGeneratedCode(generateMatchCode())
              }}
              className="rounded-lg p-2 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Gerar novo código"
            >
              🔄
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setView('menu')
              }}
              className="flex-1 rounded-xl border border-white/10 py-4 font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Voltar
            </button>
            <button
              onClick={() => {
                onCreatePrivate(generatedCode)
              }}
              className="flex-1 rounded-xl bg-purple-600 py-4 font-bold text-white hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
            >
              Criar Sala
            </button>
          </div>
        </motion.div>
      )}

      {view === 'join' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">Entrar em Sala</h3>
            <p className="mt-2 text-sm text-slate-400">Insere o código de acesso.</p>
          </div>

          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="A1B2"
            className="w-full rounded-2xl border-2 border-white/10 bg-black/30 p-6 text-center text-4xl font-bold tracking-[0.2em] text-white outline-none focus:border-emerald-500/50 focus:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all placeholder:text-white/10"
            maxLength={4}
          />

          <div className="flex gap-4">
            <button
              onClick={() => {
                setView('menu')
              }}
              className="flex-1 rounded-xl border border-white/10 py-4 font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Voltar
            </button>
            <button
              onClick={() => {
                onJoinPrivate(inviteCode)
              }}
              disabled={inviteCode.length < 4}
              className="flex-1 rounded-xl bg-emerald-600 py-4 font-bold text-white hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Entrar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

