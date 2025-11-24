"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Save, LogOut, User as UserIcon, Globe, Edit2, Trophy, Calendar, Sparkles, Shield } from "lucide-react";
import BackgroundGrid from "@/components/BackgroundGrid";
import Navbar from "@/components/Navbar";
import Image from "next/image";
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
            const { data: profileData } = await supabase
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

        } catch (err: unknown) {
            setMessage({ type: "error", text: (err as Error).message });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const updates: Partial<Profile> = {
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

        } catch (err: unknown) {
            setMessage({ type: "error", text: (err as Error).message });
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
            <div className="min-h-screen flex items-center justify-center bg-[#030014]">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    const isGuest = user?.is_anonymous;

    return (
        <main className="min-h-screen bg-[#030014] relative overflow-hidden pt-32 px-4 pb-20">
            <BackgroundGrid />
            <Navbar />

            {/* Ambient Orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="mx-auto max-w-6xl relative z-10 space-y-8">
                {/* Profile Header */}
                <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                                <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                    {profile?.avatar_url ? (
                                        <Image
                                            src={profile.avatar_url}
                                            alt={profile.display_name || 'Avatar'}
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <UserIcon size={48} className="text-white/40" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-colors">
                                <Edit2 size={16} />
                            </button>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                    {profile?.display_name || 'Utilizador'}
                                </h1>
                                {isGuest ? (
                                    <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider">
                                        Convidado
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Shield size={12} />
                                        Membro Oficial
                                    </span>
                                )}
                            </div>
                            <p className="text-white/40 font-medium">@{profile?.username || 'username'}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                <div className="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    <Trophy size={14} className="text-yellow-500" />
                                    <span className="text-white font-bold">{profile?.experience_points || 0}</span> XP Total
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    <Calendar size={14} className="text-purple-500" />
                                    Membro desde {new Date(profile?.created_at || Date.now()).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <LogOut size={16} />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Account Conversion Card (Only for Guests) */}
                        {user?.is_anonymous && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card rounded-3xl p-6 border border-yellow-500/20 relative overflow-hidden"
                            >
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

                                <div className="flex items-center gap-3 mb-4 relative">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                                        <Save size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Salvar Progresso</h2>
                                        <p className="text-white/40 text-xs">Cria uma conta permanente.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleConvertAccount} className="space-y-4 relative">
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-black/40 transition-all"
                                            placeholder="Username único"
                                            required
                                            minLength={3}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-black/40 transition-all"
                                            placeholder="Email"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-black/40 transition-all"
                                            placeholder="Password"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {updating ? <Loader2 className="animate-spin" size={18} /> : "Criar Conta"}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column: Details & Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Edit Profile Section */}
                        <div className="glass-card rounded-3xl p-8 border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Shield size={20} className="text-blue-400" />
                                    Detalhes da Conta
                                </h2>
                                {!isEditing && !user?.is_anonymous && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                            </div>

                            {message && (
                                <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-2 ${message.type === "success"
                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
                                    {message.text}
                                </div>
                            )}

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Nome de Exibição</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                                minLength={3}
                                                maxLength={20}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">País (Código)</label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                                <input
                                                    type="text"
                                                    value={editCountry}
                                                    onChange={(e) => setEditCountry(e.target.value.toUpperCase())}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                                    maxLength={2}
                                                    placeholder="PT"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                        >
                                            {updating ? <Loader2 className="animate-spin" size={16} /> : "Guardar Alterações"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-3 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">País</p>
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <Globe size={16} className="text-blue-400" />
                                            {profile?.country_code || "Não definido"}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Membro Desde</p>
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <Calendar size={16} className="text-purple-400" />
                                            {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity / Stats Placeholder */}
                        <div className="glass-card rounded-3xl p-8 border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-purple-400" />
                                    Estatísticas Recentes
                                </h2>
                            </div>

                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                                    <Trophy className="text-white/20" size={32} />
                                </div>
                                <p className="text-white/40 font-medium">Ainda não tens estatísticas suficientes.</p>
                                <p className="text-white/20 text-sm mt-1">Joga para desbloquear insights detalhados.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
