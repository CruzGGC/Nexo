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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl transition-all dark:bg-zinc-900 animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-zinc-800">
        
        <div className="mb-8 text-7xl animate-bounce">
          {result === 'victory' ? '🏆' : result === 'defeat' ? '💔' : '🤝'}
        </div>

        <h2 className="mb-3 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          {result === 'victory' ? 'Vitória!' : result === 'defeat' ? 'Derrota!' : 'Empate!'}
        </h2>

        <p className="mb-8 text-lg font-medium text-zinc-600 dark:text-zinc-400">
          {result === 'victory' 
            ? 'Parabéns! Foste o mais rápido.' 
            : result === 'defeat'
              ? `O teu oponente ${winnerName ? `(${winnerName})` : ''} terminou primeiro.`
              : 'Foi um jogo muito renhido!'}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-900 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
