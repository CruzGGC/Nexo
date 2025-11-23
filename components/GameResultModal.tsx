'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface GameResultModalProps {
  isOpen: boolean
  result: 'victory' | 'defeat' | 'draw'
  winnerName?: string
  onClose: () => void
}

export function GameResultModal({ isOpen, result, winnerName, onClose }: GameResultModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => {
      clearTimeout(timer)
      setMounted(false)
    }
  }, [])

  if (!mounted || !isOpen) return null

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all animate-in zoom-in-95 duration-300 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5" />

        <div className="relative z-10">
          <div className="mb-8 text-7xl animate-bounce">
            {result === 'victory' ? '🏆' : result === 'defeat' ? '💔' : '🤝'}
          </div>

          <h2 className={`mb-3 text-4xl font-black tracking-tight uppercase italic ${result === 'victory'
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]'
              : result === 'defeat'
                ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'text-white'
            }`}>
            {result === 'victory' ? 'Vitória!' : result === 'defeat' ? 'Derrota!' : 'Empate!'}
          </h2>

          <p className="mb-8 text-lg font-medium text-zinc-400">
            {result === 'victory'
              ? 'Parabéns! Foste o mais rápido.'
              : result === 'defeat'
                ? `O teu oponente ${winnerName ? `(${winnerName})` : ''} terminou primeiro.`
                : 'Foi um jogo muito renhido!'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-white px-6 py-4 text-lg font-bold text-black transition-all hover:scale-[1.02] hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Voltar ao Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
