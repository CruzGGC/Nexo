"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Save, LogOut, Shield, User as UserIcon, Globe, Edit2 } from "lucide-react";
import BackgroundGrid from "@/components/BackgroundGrid";
import Navbar from "@/components/Navbar";
import { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Conversion form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    // Edit profile state
    const [displayName, setDisplayName] = useState("");
    const [editCountry, setEditCountry] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const getData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/login");
                return;
            }
            setUser(session.user);

            // Fetch profile
            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setDisplayName(profileData.display_name || "");
                setEditCountry(profileData.country_code || "");
                setEditUsername(profileData.username || "");
            }

            setLoading(false);
        };
        getData();
    }, [router]);

    const handleConvertAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            // 1. Update auth credentials
            const { error: authError } = await supabase.auth.updateUser({
                email,
                password,
            });

            if (authError) throw authError;

            // 2. Update profile with new username and remove anonymous flag
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    username: username,
                    is_anonymous: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user!.id);

            if (profileError) throw profileError;

            setMessage({ type: "success", text: "Conta atualizada com sucesso! Verifica o teu email." });

            // Refresh data
            const { data: { user: newUser } } = await supabase.auth.getUser();
            setUser(newUser);

            // Refresh profile
            const { data: newProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user!.id)
                .single();

            if (newProfile) setProfile(newProfile);

        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const updates: any = {
                display_name: displayName,
                country_code: editCountry || null,
                updated_at: new Date().toISOString(),
            };

            if (editUsername !== profile?.username) {
                updates.username = editUsername;
            }

            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("user_id", user!.id);

            if (error) throw error;

            setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });

            // Refresh profile
            const { data: newProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user!.id)
                .single();

            if (newProfile) {
                setProfile(newProfile);
                setIsEditing(false);
            }

        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] relative overflow-hidden pt-32 px-4">
            <BackgroundGrid />
            <Navbar />

            <div className="max-w-2xl mx-auto mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-8 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-black text-white">O Meu Perfil</h1>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-bold"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-xl border text-sm ${message.type === "success"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Info / Edit Form */}
                    <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <UserIcon size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{profile?.display_name || "Utilizador"}</h2>
                                    <p className="text-white/40 text-sm">@{profile?.username || "sem_username"}</p>
                                </div>
                            </div>
                            {!user?.is_anonymous && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                                >
                                    <Edit2 size={20} />
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Nome de Exibição</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                            minLength={3}
                                            maxLength={32}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Username</label>
                                        <input
                                            type="text"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                            minLength={3}
                                            maxLength={20}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider">País (Código 2 letras)</label>
                                        <input
                                            type="text"
                                            value={editCountry}
                                            onChange={(e) => setEditCountry(e.target.value.toUpperCase())}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                            maxLength={2}
                                            placeholder="PT"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        {updating ? <Loader2 className="animate-spin" size={16} /> : "Guardar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-white/40 mb-1">Estado</p>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        {user?.is_anonymous ? "Convidado" : "Membro"}
                                        {user?.is_anonymous && (
                                            <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/20">
                                                Temporário
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/40 mb-1">País</p>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        <Globe size={14} />
                                        {profile?.country_code || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/40 mb-1">XP Total</p>
                                    <p className="text-white font-medium">{profile?.experience_points || 0} XP</p>
                                </div>
                                <div>
                                    <p className="text-white/40 mb-1">Membro desde</p>
                                    <p className="text-white font-medium">
                                        {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {user?.is_anonymous && (
                        <div className="border-t border-white/10 pt-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Save size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Salvar Progresso</h2>
                                    <p className="text-white/40 text-sm">Cria uma conta permanente para não perderes nada.</p>
                                </div>
                            </div>

                            <form onSubmit={handleConvertAccount} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1">Username</label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                            placeholder="Escolhe um username único"
                                            required
                                            minLength={3}
                                            maxLength={20}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                            placeholder="teu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1">Nova Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updating ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        "Criar Conta Permanente"
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
