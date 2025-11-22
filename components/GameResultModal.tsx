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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xl transition-all dark:bg-zinc-900 animate-in zoom-in-95 duration-300">
        
        <div className="mb-6 text-6xl animate-bounce">
          {result === 'victory' ? '🏆' : result === 'defeat' ? '💔' : '🤝'}
        </div>

        <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
          {result === 'victory' ? 'Vitória!' : result === 'defeat' ? 'Derrota!' : 'Empate!'}
        </h2>

        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
          {result === 'victory' 
            ? 'Parabéns! Foste o mais rápido.' 
            : result === 'defeat'
              ? `O teu oponente ${winnerName ? `(${winnerName})` : ''} terminou primeiro.`
              : 'Foi um jogo muito renhido!'}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
