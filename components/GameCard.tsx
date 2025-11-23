"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Crosshair, Hash, Search, Grid3x3, LucideIcon } from "lucide-react";
import { MouseEvent } from "react";

const icons: Record<string, LucideIcon> = {
    crosshair: Crosshair,
    hash: Hash,
    search: Search,
    grid: Grid3x3,
};

interface GameCardProps {
    title: string;
    description: string;
    href: string;
    color: string;
    iconName: keyof typeof icons;
    delay?: number;
}

export default function GameCard({ title, description, href, color, iconName, delay = 0 }: GameCardProps) {
    const Icon = icons[iconName];

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-300, 300], [20, -20]);
    const rotateY = useTransform(mouseX, [-300, 300], [-20, 20]);
    const iconX = useTransform(mouseX, [-300, 300], [-40, 40]);
    const iconY = useTransform(mouseY, [-300, 300], [-40, 40]);

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.6 }}
            style={{ perspective: 1000 }}
            className="h-full"
        >
            <Link href={href} className="block h-full">
                <motion.div
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    className="relative h-full min-h-[300px] p-8 rounded-[2rem] overflow-hidden group border border-white/10 bg-[#0a0a0a]"
                >
                    {/* Gradient Background */}
                    <div
                        className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                        style={{
                            background: `linear-gradient(135deg, ${color}, transparent 80%)`,
                        }}
                    />

                    {/* Floating Background Icon */}
                    <motion.div
                        style={{ x: iconX, y: iconY, z: 0 }}
                        className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors duration-500"
                    >
                        <Icon size={240} strokeWidth={1} />
                    </motion.div>

                    {/* Content */}
                    <div style={{ transform: "translateZ(60px)" }} className="relative z-10 flex flex-col h-full">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                            style={{ backgroundColor: `${color}30`, border: `1px solid ${color}50` }}
                        >
                            <Icon size={32} color={color} />
                        </div>

                        <h3 className="text-3xl font-black mb-4 text-white tracking-tight">
                            {title}
                        </h3>

                        <p className="text-white/60 mb-8 leading-relaxed font-medium">
                            {description}
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-sm font-bold uppercase tracking-wider group-hover:gap-4 transition-all" style={{ color }}>
                            Jogar Agora
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Shine Effect */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 40%, transparent 60%)`
                        }}
                    />
                </motion.div>
            </Link>
        </motion.div>
    );
}
