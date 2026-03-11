"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

const team = [
  { name: "Vladyslav Yaremchuk", role: "Founder & Creative Director", initials: "VY" },
  { name: "Team Member", role: "Game Developer", initials: "TM" },
  { name: "Team Member", role: "Artist", initials: "TM" },
  { name: "Team Member", role: "Sound Designer", initials: "TM" },
];

export default function Team() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".team-card", {
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section id="team" ref={ref} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 text-center">Team</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-6 text-center">The People Behind ATMA</h2>
        <p className="text-lg text-white/50 text-center max-w-2xl mx-auto mb-16">
          A small, passionate team united by a shared vision of creating meaningful gaming experiences.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m, i) => (
            <div
              key={`${m.name}-${i}`}
              className="team-card text-center p-6 rounded-xl bg-dark-800/50 border border-white/5"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-500/20 to-dark-700 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-lg text-accent-400">{m.initials}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{m.name}</h3>
              <p className="text-sm text-white/40">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
