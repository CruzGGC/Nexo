"use client";

import { motion } from "framer-motion";
import { Trophy, Users, Zap, Shield } from "lucide-react";

const features = [
    {
        icon: Trophy,
        title: "Competitivo",
        description: "Sobe nos rankings e mostra quem manda.",
    },
    {
        icon: Users,
        title: "Multijogador",
        description: "Joga com amigos ou desafia estranhos.",
    },
    {
        icon: Zap,
        title: "Rápido",
        description: "Sem lag, sem espera. Ação instantânea.",
    },
    {
        icon: Shield,
        title: "Seguro",
        description: "Fair play garantido em todas as partidas.",
    },
];

export default function Features() {
    return (
        <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold text-center mb-16 text-gradient"
                >
                    Porquê o Nexo?
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-blue-400">
                                <feature.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-white/50">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
