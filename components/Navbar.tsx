"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { User as UserIcon } from "lucide-react";

const navLinks = [
    { name: "Início", href: "/" },
    { name: "Jogos", href: "#games" },
    { name: "Sobre", href: "/sobre" },
    { name: "Leaderboard", href: "/leaderboards" },
];

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-50",
                "w-[90%] max-w-4xl rounded-full",
                "glass px-6 py-3",
                "flex items-center justify-between",
                "border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            )}
        >
            <Link href="/" className="relative w-24 h-8 hover:opacity-80 transition-opacity">
                <Image
                    src="/NexoBranco.png"
                    alt="Nexo Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </Link>

            <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="text-sm font-medium text-white/70 hover:text-white transition-colors relative group"
                    >
                        {link.name}
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-400 transition-all group-hover:w-full shadow-[0_0_10px_#3b82f6]" />
                    </Link>
                ))}
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <Link
                        href="/profile"
                        className="px-5 py-2 text-sm font-bold text-white bg-white/10 border border-white/10 rounded-full hover:bg-white/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <UserIcon size={16} />
                        Perfil
                    </Link>
                ) : (
                    <Link
                        href="/auth/login"
                        className="px-5 py-2 text-sm font-bold text-black bg-white rounded-full hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    >
                        Entrar
                    </Link>
                )}
            </div>
        </motion.nav>
    );
}
