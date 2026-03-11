"use client";

import { Briefcase } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

const roles = [
  { title: "Game Developer", type: "Full-time / Remote", description: "Build core gameplay systems in Unity/Godot." },
  { title: "2D Artist", type: "Full-time / Remote", description: "Create characters, environments, and UI art." },
  { title: "Sound Designer", type: "Contract / Remote", description: "Craft immersive soundscapes and effects." },
  { title: "Community Manager", type: "Part-time / Remote", description: "Grow and nurture our player community." },
];

export default function JoinUs() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".join-card", {
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
    <section ref={ref} className="py-24 px-6 bg-dark-900/50">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 text-center">Careers</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-6 text-center">Join the Team</h2>
        <p className="text-lg text-white/50 text-center max-w-2xl mx-auto mb-16">
          We're looking for passionate individuals who share our vision. If you want to create games that matter, we'd
          love to hear from you.
        </p>

        <div className="space-y-4">
          {roles.map((r) => (
            <div
              key={r.title}
              className="join-card flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl bg-dark-800/50 border border-white/5 hover:border-accent-500/20 transition-colors gap-4"
            >
              <div className="flex items-start gap-4">
                <Briefcase className="w-5 h-5 text-accent-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-base font-semibold text-white">{r.title}</h3>
                  <p className="text-sm text-white/40 mt-1">{r.description}</p>
                </div>
              </div>
              <span className="text-xs text-white/30 uppercase tracking-wider whitespace-nowrap">{r.type}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="mailto:ceo@atmagaming.com?subject=Job Application"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Apply Now
          </a>
        </div>
      </div>
    </section>
  );
}
