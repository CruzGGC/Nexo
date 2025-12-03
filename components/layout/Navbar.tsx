"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { User as UserIcon, LogIn } from "lucide-react";

const navLinks = [
    { name: "Início", href: "/" },
    { name: "Jogos", href: "#games" },
    { name: "Sobre", href: "/sobre" },
    { name: "Leaderboard", href: "/leaderboards" },
];

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    return (
        <motion.nav
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: -100, opacity: 0 },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-50",
                "w-[95%] max-w-5xl rounded-full",
                "glass px-6 py-4",
                "flex items-center justify-between",
                "border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
            )}
        >
            <Link href="/" className="relative w-28 h-8 hover:opacity-80 transition-opacity group">
                <Image
                    src="/NexoBranco.png"
                    alt="Nexo Logo"
                    fill
                    className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    priority
                />
            </Link>

            <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="relative text-sm font-medium text-white/60 hover:text-white transition-colors group py-2"
                    >
                        {link.name}
                        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </Link>
                ))}
            </div>

            <div className="flex items-center gap-4">
                {authLoading ? (
                    <div className="w-24 h-10 rounded-full bg-white/5 animate-pulse" />
                ) : user ? (
                    <Link
                        href="/profile"
                        className="px-5 py-2.5 text-sm font-bold text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-2 group"
                    >
                        <UserIcon size={16} className="group-hover:text-blue-400 transition-colors" />
                        Perfil
                    </Link>
                ) : (
                    <Link
                        href="/auth/login"
                        className="relative px-6 py-2.5 text-sm font-bold text-black bg-white rounded-full overflow-hidden group transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center gap-2 group-hover:text-white transition-colors">
                            <LogIn size={16} />
                            Entrar
                        </span>
                    </Link>
                )}
            </div>
        </motion.nav>
    );
}
