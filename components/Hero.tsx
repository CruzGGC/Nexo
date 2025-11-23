"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, User, Gamepad2 } from "lucide-react";

export default function Hero() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const containerRef = useRef(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    // Fun fact: This function is powered by caffeine and deadline panic.
    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
            router.push("/#games");
            router.refresh();
        } catch (error) {
            console.error("Error signing in anonymously (ghost mode failed):", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section ref={containerRef} className="relative h-auto flex flex-col items-center justify-center overflow-visible py-32 pb-48">
            {/* Animated Orbs - Because everything is better with orbs */}
            <motion.div
                style={{ y: y1 }}
                className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
            />
            <motion.div
                style={{ y: y2 }}
                className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
            />

            <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="relative mb-12 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative w-32 h-32 md:w-48 md:h-48 glass rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                        <Image
                            src="/NexoBranco.png"
                            alt="Nexo Logo"
                            width={140}
                            height={140}
                            className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            priority
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8 relative"
                >
                    {/* Using inline-block to prevent text clipping with proper spacing */}
                    <div className="px-8 py-6">
                        <h1 className="inline-block text-7xl md:text-9xl font-black tracking-tighter leading-none">
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50" style={{ filter: 'drop-shadow(0 4px 20px rgba(255, 255, 255, 0.3))' }}>
                                NEXO
                            </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 neon-text-blue ml-1">
                                .
                            </span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 text-blue-200/60 font-mono text-sm md:text-base tracking-widest uppercase mt-4">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                </motion.div>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg md:text-2xl text-white/60 mb-12 text-center max-w-2xl px-4 font-light leading-relaxed"
                >
                    Redefinindo os clássicos com design <span className="text-white font-semibold">premium</span> e competição <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">global</span>.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col md:flex-row items-center gap-6"
                >
                    <Link
                        href="#games"
                        className="group relative px-8 py-4 bg-white text-black text-lg font-black rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center gap-2 group-hover:text-white transition-colors">
                            <Gamepad2 className="w-5 h-5" />
                            JOGAR AGORA
                        </span>
                    </Link>

                    <button
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="px-8 py-4 glass text-white text-lg font-bold rounded-xl transition-all hover:bg-white/10 hover:border-white/20 flex items-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <User className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                                <span>Modo Convidado</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
            >
                <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
            </motion.div>
        </section>
    );
}
