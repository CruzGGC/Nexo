"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";
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
        <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505]">
            <BackgroundGrid />

            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20"
            >
                <ArrowLeft size={20} />
                Voltar
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 rounded-3xl glass relative z-10 mx-4"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">Bem-vindo de volta</h1>
                    <p className="text-white/40">Entra para continuares a tua jornada</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60 ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                placeholder="exemplo@nexo.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Entrar"
                        )}
                    </button>

                    <div className="relative flex items-center gap-4 my-6">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-white/40 text-sm">ou</span>
                        <div className="h-px bg-white/10 flex-1" />
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
                        className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <User size={20} />
                        Entrar como Convidado
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-white/40">
                    Ainda não tens conta?{" "}
                    <Link href="/auth/register" className="text-white hover:text-blue-400 font-medium transition-colors">
                        Regista-te
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
