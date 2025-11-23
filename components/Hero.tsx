"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, User } from "lucide-react";

export default function Hero() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
            router.push("/#games"); // Redirect to games section after login
            router.refresh();
        } catch (error) {
            console.error("Error signing in anonymously:", error);
        } finally {
            setLoading(false);
        }
    };

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
                    className="flex flex-col md:flex-row items-center gap-4"
                >
                    <Link
                        href="#games"
                        className="px-12 py-6 bg-white text-black text-xl font-black rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:bg-blue-500 hover:text-white flex items-center gap-2"
                    >
                        JOGAR AGORA
                    </Link>

                    <button
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="px-8 py-6 bg-white/5 border border-white/10 text-white text-lg font-bold rounded-2xl transition-all hover:scale-105 hover:bg-white/10 hover:border-white/20 flex items-center gap-2 backdrop-blur-sm"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-6 h-6" />
                        ) : (
                            <>
                                <User className="w-6 h-6" />
                                <span>Modo Convidado</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
