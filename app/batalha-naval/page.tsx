import dynamic from 'next/dynamic'

const BattleshipGame = dynamic(() => import('@/components/BattleshipGame'), { ssr: false })

export const metadata = {
  title: 'Batalha Naval | Nexo',
  description: 'Desafia amigos ou jogadores aleatórios numa batalha naval 1v1 com matchmaking público e códigos privados.'
}

export default function BatalhaNavalPage() {
  return <BattleshipGame />
}
