"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

const companions = [
  {
    name: "Helios",
    role: "The Radiant Warrior",
    description: "A former soldier of the regime who defected after witnessing its true nature.",
  },
  {
    name: "Kai",
    role: "The Shadow Trickster",
    description: "A cunning infiltrator who uses deception as a weapon against the corrupt.",
  },
  {
    name: "Iris",
    role: "The Seer",
    description: "A mystic who can perceive the threads of fate and guide others through darkness.",
  },
  {
    name: "Kira",
    role: "The Alchemist",
    description: "A brilliant inventor who transforms raw elements into powerful tools of rebellion.",
  },
  {
    name: "Darius",
    role: "The Guardian",
    description: "An unyielding protector whose strength comes from his unshakable convictions.",
  },
  { name: "Ronin", role: "The Wanderer", desc: "A masterless blade seeking purpose in a world that has lost its way." },
  { name: "Lucy", role: "The Healer", desc: "A compassionate soul who mends both wounds and spirits with equal care." },
  {
    name: "Nellie",
    role: "The Chronicler",
    description: "A keeper of forbidden knowledge who preserves the truth the regime tries to erase.",
  },
];

export default function Characters() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".char-card", {
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
        y: 50,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section id="characters" ref={ref} className="py-24 px-6 bg-dark-900/50">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 text-center">Characters</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-6 text-center">Your Companions</h2>
        <p className="text-lg text-white/50 text-center max-w-2xl mx-auto mb-16">
          Allies who join your fight, each carrying their own scars, strengths, and stories.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companions.map((c) => (
            <div
              key={c.name}
              className="char-card p-6 rounded-xl bg-dark-800/50 border border-white/5 hover:border-accent-500/20 transition-all group"
            >
              {/* Avatar placeholder */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500/30 to-accent-600/10 border border-accent-500/20 flex items-center justify-center mb-4 group-hover:border-accent-500/40 transition-colors">
                <span className="font-display text-lg text-accent-400">{c.name[0]}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{c.name}</h3>
              <p className="text-xs text-accent-400 mb-3">{c.role}</p>
              <p className="text-sm text-white/40">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
