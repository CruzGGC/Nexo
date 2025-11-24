"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, User, Sparkles } from "lucide-react";
import BackgroundGrid from "@/components/BackgroundGrid";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            router.push("/");
            router.refresh();
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030014]">
            <BackgroundGrid />

            {/* Ambient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />

            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20 group"
            >
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Voltar</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                className="w-full max-w-md p-8 rounded-3xl glass-card relative z-10 mx-4 border border-white/10 shadow-2xl shadow-black/50"
            >
                <div className="text-center mb-8 relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-12 blur-xl opacity-50" />
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                        <Sparkles className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Bem-vindo</h1>
                    <p className="text-white/40 font-medium">Entra para continuares a tua jornada</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 ml-1 uppercase tracking-wider">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
                                placeholder="exemplo@nexo.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 ml-1 uppercase tracking-wider">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Entrar"
                        )}
                    </button>

                    <div className="relative flex items-center gap-4 my-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                        <span className="text-white/30 text-xs font-bold uppercase tracking-widest">ou</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1" />
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const { error } = await supabase.auth.signInAnonymously();
                                if (error) throw error;
                                router.push("/");
                                router.refresh();
                            } catch (err: unknown) {
                                setError((err as Error).message);
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        <User size={20} className="text-white/50 group-hover:text-white transition-colors" />
                        Entrar como Convidado
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-white/40">
                    Ainda não tens conta?{" "}
                    <Link href="/auth/register" className="text-white hover:text-blue-400 font-bold transition-colors hover:underline decoration-blue-400/30 underline-offset-4">
                        Regista-te
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
