"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

const worlds = [
  {
    name: "World of Greed",
    description: "A realm of excess where materialism consumes all. Golden towers hide hollow souls.",
    color: "from-yellow-600/20 to-transparent",
  },
  {
    name: "World of Wrath",
    description: "Burning landscapes of uncontrolled rage. Destruction is the only language spoken here.",
    color: "from-red-600/20 to-transparent",
  },
  {
    name: "World of Sloth",
    description: "A decaying paradise where apathy reigns. Beauty fades as ambition withers.",
    color: "from-blue-600/20 to-transparent",
  },
  {
    name: "World of Envy",
    description: "Mirrors and illusions everywhere. Nothing is real, nothing is ever enough.",
    color: "from-green-600/20 to-transparent",
  },
  {
    name: "World of Pride",
    description: "Towering monuments to ego. The higher you climb, the further you fall.",
    color: "from-purple-600/20 to-transparent",
  },
  {
    name: "World of Lust",
    description: "A seductive labyrinth of desire. Pleasure masks the emptiness beneath.",
    color: "from-pink-600/20 to-transparent",
  },
];

export default function Universe() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".world-card", {
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
        y: 50,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section id="universe" ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 text-center">Universe & Worlds</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-6 text-center">Six Worlds. Six Enemies.</h2>
        <p className="text-lg text-white/50 text-center max-w-2xl mx-auto mb-16">
          Each world represents an enemy of the soul — a fundamental flaw that the regime exploits to maintain control.
          Conquer them to reclaim your true self.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.map((w) => (
            <div
              key={w.name}
              className={`world-card relative p-6 rounded-xl bg-dark-800/50 border border-white/5 overflow-hidden hover:border-white/10 transition-colors`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${w.color} pointer-events-none`} />
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-3">{w.name}</h3>
                <p className="text-sm text-white/50">{w.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
