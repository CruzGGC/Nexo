"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";


export default function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-20">
            {/* Dynamic Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="w-full flex flex-col items-center justify-center z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut", type: "spring" }}
                    className="relative mb-12"
                >
                    {/* Logo Container */}
                    <div className="relative w-40 h-40 md:w-56 md:h-56">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[3rem] rotate-6 opacity-20 blur-xl animate-pulse" />
                        <div className="absolute inset-0 bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                            <Image
                                src="/NexoBranco.png"
                                alt="Nexo Logo"
                                width={160}
                                height={160}
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-5xl md:text-7xl font-black text-center mb-6 tracking-tighter"
                >
                    <span className="text-white">NEXO</span>
                    <span className="text-blue-500">.</span>
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-xl md:text-2xl text-white/60 mb-12 text-center max-w-xl px-4 font-medium"
                >
                    A plataforma definitiva para jogos clássicos. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-bold">
                        Compete. Ganha. Domina.
                    </span>
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="relative z-[60] mt-8"
                >
                    <Link
                        href="#games"
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:scale-105"
                    >
                        <span className="relative">JOGAR AGORA</span>
                        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-lg" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
