"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
    id: number;
    x: string;
    y: string;
    scale: number;
    duration: number;
    size: number;
    targetY: string;
}

export default function BackgroundGrid() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            duration: Math.random() * 10 + 10,
            size: Math.random() * 4 + 2,
            targetY: Math.random() * -100 + "%",
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[#050505]" />

            {/* Moving Grid */}
            <motion.div
                initial={{ transform: "perspective(500px) rotateX(60deg) translateY(0)" }}
                animate={{ transform: "perspective(500px) rotateX(60deg) translateY(50px)" }}
                transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                }}
                className="absolute inset-[-100%] w-[300%] h-[300%] opacity-30"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
          `,
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Floating Particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute bg-blue-500 rounded-full opacity-20"
                    initial={{
                        x: particle.x,
                        y: particle.y,
                        scale: particle.scale,
                    }}
                    animate={{
                        y: [null, particle.targetY],
                        opacity: [0.2, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        width: particle.size + "px",
                        height: particle.size + "px",
                    }}
                />
            ))}

            {/* Vignette & Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0a0a0a] opacity-60" />
        </div>
    );
}
