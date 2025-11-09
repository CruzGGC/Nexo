import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sopa de Letras - Nexo',
  description: 'Jogo de Sopa de Letras em Português. Modo diário com leaderboard e modo aleatório para prática.',
}

export default function WordSearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
