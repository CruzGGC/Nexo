"use client";

import { motion } from "framer-motion";
import { Trophy, Users, Zap, Shield } from "lucide-react";

const features = [
    {
        icon: Trophy,
        title: "Competitivo",
        description: "Sobe nos rankings e mostra quem manda.",
        color: "#3b82f6",
    },
    {
        icon: Users,
        title: "Multijogador",
        description: "Joga com amigos ou desafia estranhos.",
        color: "#a855f7",
    },
    {
        icon: Zap,
        title: "Rápido",
        description: "Sem lag, sem espera. Ação instantânea.",
        color: "#ec4899",
    },
    {
        icon: Shield,
        title: "Seguro",
        description: "Fair play garantido em todas as partidas.",
        color: "#22c55e",
    },
];

export default function Features() {
    return (
        <section className="py-32 px-4 relative">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-6xl font-black mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                            PORQUÊ O
                        </span>{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 neon-text-blue">
                            NEXO?
                        </span>
                    </h2>
                    <p className="text-white/40 text-lg max-w-2xl mx-auto">
                        Construído para a próxima geração de jogadores.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="group relative p-8 rounded-3xl glass-card border border-white/5 bg-white/[0.02] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                                style={{ backgroundColor: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
                            >
                                <feature.icon size={28} style={{ color: feature.color }} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                            </div>

                            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                                {feature.title}
                            </h3>

                            <p className="text-white/40 group-hover:text-white/60 transition-colors leading-relaxed">
                                {feature.description}
                            </p>

                            <div
                                className="absolute bottom-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                                style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
