'use client'

import { useState } from 'react'
import { generateMatchCode } from '@/lib/matchmaking'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MatchmakingViewProps {
  onJoinPublic: () => void
  onCreatePrivate: (code: string) => void
  onJoinPrivate: (code: string) => void
  onCancel: () => void
  status: string
  roomCode?: string
  title?: string
  description?: string
}

export function MatchmakingView({
  onJoinPublic,
  onCreatePrivate,
  onJoinPrivate,
  onCancel,
  status,
  roomCode,
  title = 'MODO ONLINE',
  description = 'Escolhe o teu método de conexão.'
}: MatchmakingViewProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState(generateMatchCode())
  const [view, setView] = useState<'menu' | 'create' | 'join'>('menu')
  const [copied, setCopied] = useState(false)

  const isSearching = status === 'queued' || status === 'joining' || status === 'matched'

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateCode = () => {
    setGeneratedCode(generateMatchCode())
    setCopied(false)
  }

  return (
    <div className="relative w-full min-h-full">
      {/* Back Button - Always visible */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onCancel}
        className="absolute top-0 left-0 z-30 text-sm font-bold tracking-wider text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span>VOLTAR</span>
      </motion.button>

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12">
        <AnimatePresence mode="wait">
          {/* Searching State */}
          {isSearching ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center gap-8 w-full"
            >
              {/* Animated Radar */}
              <div className="relative h-56 w-56">
                <motion.div 
                  className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-500/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div 
                  className="absolute inset-4 rounded-full bg-cyan-500/10 border border-cyan-500/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                />
                <motion.div 
                  className="absolute inset-8 rounded-full bg-cyan-500/10 border border-cyan-500/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-7xl"
                  >
                    📡
                  </motion.div>
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center space-y-4">
                <motion.h2 
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {status === 'matched' ? 'OPONENTE ENCONTRADO!' : 'À PROCURA...'}
                </motion.h2>
                <p className="text-lg text-slate-400 max-w-md">
                  {status === 'matched'
                    ? 'A preparar partida...'
                    : 'A procurar oponente no sistema global...'}
                </p>
              </div>

              {/* Room Code Display */}
              {roomCode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Código da Sala</span>
                  <div className="rounded-2xl bg-black/40 backdrop-blur-sm border border-cyan-500/30 px-8 py-4">
                    <code className="text-3xl font-mono font-black tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                      {roomCode}
                    </code>
                  </div>
                </motion.div>
              )}

              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="mt-4 rounded-xl border-2 border-white/10 bg-black/20 backdrop-blur-sm px-8 py-3 text-sm font-bold tracking-wider text-slate-400 transition-colors hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5"
              >
                CANCELAR
              </motion.button>
            </motion.div>
          ) : (
            /* Menu Views */
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-10 w-full"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <h1 className="text-5xl font-black text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-lg text-slate-400">
                  {description}
                </p>
              </div>

              {/* Menu Grid */}
              {view === 'menu' && (
                <div className="grid gap-5 w-full max-w-lg">
                  {/* Quick Match */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onJoinPublic}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-7 text-left backdrop-blur-md transition-all hover:border-cyan-500/50 hover:shadow-[0_8px_40px_rgba(6,182,212,0.25)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-5">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-4xl shadow-lg shadow-cyan-500/20"
                      >
                        🌍
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-1">
                          Procurar Jogo
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Matchmaking global automático
                        </p>
                      </div>
                      <motion.div
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="text-cyan-400 text-2xl"
                      >
                        →
                      </motion.div>
                    </div>
                  </motion.button>

                  {/* Create Private Room */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('create')}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-7 text-left backdrop-blur-md transition-all hover:border-purple-500/50 hover:shadow-[0_8px_40px_rgba(168,85,247,0.25)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-5">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-4xl shadow-lg shadow-purple-500/20"
                      >
                        🔑
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors mb-1">
                          Criar Sala Privada
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Gera código para convidar amigos
                        </p>
                      </div>
                      <motion.div
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="text-purple-400 text-2xl"
                      >
                        →
                      </motion.div>
                    </div>
                  </motion.button>

                  {/* Join Private Room */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('join')}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-7 text-left backdrop-blur-md transition-all hover:border-emerald-500/50 hover:shadow-[0_8px_40px_rgba(16,185,129,0.25)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-5">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-4xl shadow-lg shadow-emerald-500/20"
                      >
                        🚪
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors mb-1">
                          Entrar com Código
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Junta-te a uma sala privada
                        </p>
                      </div>
                      <motion.div
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="text-emerald-400 text-2xl"
                      >
                        →
                      </motion.div>
                    </div>
                  </motion.button>
                </div>
              )}

              {/* Create Room View */}
              {view === 'create' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg space-y-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-8 backdrop-blur-xl shadow-2xl"
                >
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="text-5xl mb-3">🔑</div>
                    <h3 className="text-3xl font-black text-white">Sala Privada</h3>
                    <p className="text-slate-400">Partilha o código com o teu oponente</p>
                  </div>

                  {/* Code Display */}
                  <div className="relative rounded-2xl border-2 border-purple-500/30 bg-black/40 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-4">
                      <code className="flex-1 text-center text-5xl font-mono font-black tracking-[0.25em] text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                        {generatedCode}
                      </code>
                      <div className="flex flex-col gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleRegenerateCode}
                          className="rounded-xl bg-purple-500/20 p-3 text-2xl hover:bg-purple-500/30 transition-colors"
                          title="Gerar novo código"
                        >
                          🔄
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCopyCode}
                          className="rounded-xl bg-purple-500/20 p-3 text-2xl hover:bg-purple-500/30 transition-colors relative"
                          title="Copiar código"
                        >
                          {copied ? '✓' : '📋'}
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Copy Feedback */}
                    <AnimatePresence>
                      {copied && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute -bottom-8 left-0 right-0 text-center text-sm text-emerald-400 font-medium"
                        >
                          Código copiado!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('menu')}
                      className="flex-1 rounded-xl border-2 border-white/10 bg-black/20 py-4 font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                      Voltar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onCreatePrivate(generatedCode)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                    >
                      Criar Sala
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Join Room View */}
              {view === 'join' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg space-y-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-8 backdrop-blur-xl shadow-2xl"
                >
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="text-5xl mb-3">🚪</div>
                    <h3 className="text-3xl font-black text-white">Entrar em Sala</h3>
                    <p className="text-slate-400">Insere o código de 6 caracteres</p>
                  </div>

                  {/* Code Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      autoFocus
                      maxLength={6}
                      className={cn(
                        "w-full rounded-2xl border-2 bg-black/40 backdrop-blur-sm p-6 text-center text-5xl font-mono font-black tracking-[0.3em] text-white outline-none transition-all placeholder:text-white/10",
                        inviteCode.length === 6
                          ? "border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                          : "border-white/10 focus:border-emerald-500/30 focus:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                      )}
                    />
                    {/* Character Counter */}
                    <div className="absolute -bottom-7 right-0 text-xs text-slate-500 font-medium">
                      {inviteCode.length}/6
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setView('menu')
                        setInviteCode('')
                      }}
                      className="flex-1 rounded-xl border-2 border-white/10 bg-black/20 py-4 font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                      Voltar
                    </motion.button>
                    <motion.button
                      whileHover={inviteCode.length === 6 ? { scale: 1.02 } : {}}
                      whileTap={inviteCode.length === 6 ? { scale: 0.98 } : {}}
                      onClick={() => inviteCode.length === 6 && onJoinPrivate(inviteCode)}
                      disabled={inviteCode.length < 6}
                      className={cn(
                        "flex-1 rounded-xl py-4 font-bold text-white transition-all",
                        inviteCode.length === 6
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 cursor-pointer"
                          : "bg-emerald-600/30 cursor-not-allowed opacity-50"
                      )}
                    >
                      Entrar
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
