"use client";

import { motion } from "framer-motion";
import { Gamepad2, Users, Rocket, Sparkles, Brain, Globe } from "lucide-react";
import { BackgroundGrid } from '@/components/common';
import { Navbar } from '@/components/layout';

export default function SobrePage() {
  const features = [
    {
      icon: <Brain className="text-blue-400" size={32} />,
      title: "Desafio Mental",
      description: "Jogos desenhados para exercitar o teu cérebro e vocabulário."
    },
    {
      icon: <Globe className="text-purple-400" size={32} />,
      title: "100% Português",
      description: "Focado na língua e cultura portuguesa (PT-PT)."
    },
    {
      icon: <Users className="text-pink-400" size={32} />,
      title: "Comunidade",
      description: "Joga com amigos, compete nos rankings e partilha conquistas."
    }
  ];

  const games = [
    {
      title: "Palavras Cruzadas",
      description: "O clássico intemporal, reinventado com desafios diários e modo infinito.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Sopa de Letras",
      description: "Encontra as palavras escondidas antes que o tempo acabe.",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Batalha Naval",
      description: "Estratégia e dedução num duelo clássico pelos mares.",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <main className="min-h-screen bg-[#030014] relative overflow-hidden pt-32 px-4 pb-20">
      <BackgroundGrid />
      <Navbar />

      {/* Ambient Orbs */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-24">

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
              A Nossa Missão
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
          >
            Redefinir os <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Jogos Clássicos
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 leading-relaxed"
          >
            O Nexo é uma plataforma moderna dedicada a trazer os jogos de palavras e lógica favoritos de Portugal para a era digital, com um design premium e uma experiência social envolvente.
          </motion.p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </section>

        {/* Games Showcase */}
        <section>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Gamepad2 className="text-white/40" />
              O Universo Nexo
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group overflow-hidden rounded-3xl h-80"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                <div className="absolute inset-0 backdrop-blur-3xl" />
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative h-full p-8 flex flex-col justify-end border border-white/10 rounded-3xl group-hover:border-white/30 transition-colors">
                  <div className={`absolute top-8 right-8 w-24 h-24 rounded-full bg-gradient-to-br ${game.color} blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity`} />

                  <h3 className="text-2xl font-black text-white mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {game.title}
                  </h3>
                  <p className="text-white/60 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    {game.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Future Roadmap */}
        <section className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />

          <div className="relative p-12 md:p-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-8 animate-pulse">
                <Rocket className="text-white" size={40} />
              </div>
              <h2 className="text-4xl font-black text-white mb-6">O Futuro é Brilhante</h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
                Estamos apenas a começar. Em breve teremos jogos de cartas multiplayer como Sueca e Solitário, torneios semanais e muito mais.
              </p>

              <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                <Sparkles size={20} />
                Ver Roadmap Completo
              </button>
            </motion.div>
          </div>
        </section>

      </div>
    </main>
  );
}
