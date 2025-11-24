import { LeaderboardsClient } from '@/components/LeaderboardsClient'

import BackgroundGrid from '@/components/BackgroundGrid'
import Navbar from '@/components/Navbar'
import { Trophy, Shield, Users, Crown } from 'lucide-react'

export default function LeaderboardsPage() {
  return (
    <main className="min-h-screen bg-[#030014] relative overflow-hidden pt-32 px-4 pb-20">
      <BackgroundGrid />
      <Navbar />

      {/* Ambient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      <div className="mx-auto max-w-6xl relative z-10 space-y-12">
        <header className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-900/20">
              <Crown size={14} />
              Ranking Oficial
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
            Hall da <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600 drop-shadow-[0_0_30px_rgba(251,146,60,0.3)]">Fama</span>
          </h1>

          <p className="text-xl text-white/60 leading-relaxed font-light">
            Compete contra os melhores jogadores de Portugal. Sobe nos rankings, ganha XP e conquista o teu lugar na <span className="text-white font-medium">história do Nexo</span>.
          </p>
        </header>

        <div className="glass-card rounded-3xl p-1 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="bg-black/40 rounded-[22px] p-6 md:p-8">
            <LeaderboardsClient />
          </div>
        </div>



        <section className="grid gap-6 md:grid-cols-3">
          <div className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Modo Convidado</h3>
            <p className="text-white/40 text-sm leading-relaxed">Experimenta os jogos sem compromisso. Cria uma conta depois para guardar o teu progresso.</p>
          </div>

          <div className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sistema de Ligas</h3>
            <p className="text-white/40 text-sm leading-relaxed">Sobe de divisão e ganha recompensas exclusivas ao jogares partidas ranqueadas.</p>
          </div>

          <div className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 transition-transform duration-300">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Matchmaking Justo</h3>
            <p className="text-white/40 text-sm leading-relaxed">O nosso sistema Elo garante que jogas sempre contra adversários do teu nível.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
