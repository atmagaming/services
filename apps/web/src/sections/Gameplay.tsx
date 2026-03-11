"use client";

import { RotateCcw, Swords, Users, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

const features = [
  {
    icon: Swords,
    title: "Visceral 2D Combat",
    description: "Fast-paced melee and ranged combat with fluid combo systems and dodging mechanics.",
  },
  {
    icon: Zap,
    title: "Skills & Abilities",
    description: "Unlock and upgrade a diverse skill tree. Combine abilities for devastating synergies.",
  },
  {
    icon: RotateCcw,
    title: "Rogue-lite Progression",
    description: "Each run is unique. Carry forward knowledge and key upgrades as you grow stronger.",
  },
  {
    icon: Users,
    title: "Companions",
    description: "Recruit allies with unique abilities and stories. Build bonds that shape your journey.",
  },
];

export default function Gameplay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gameplay-card", {
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
        y: 50,
        opacity: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section id="gameplay" ref={ref} className="py-24 px-6 bg-dark-900/50">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 text-center">Gameplay</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-16 text-center">Core Mechanics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="gameplay-card p-6 rounded-xl bg-dark-800/50 border border-white/5 hover:border-accent-500/20 transition-colors"
            >
              <f.icon className="w-8 h-8 text-accent-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
