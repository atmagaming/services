"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

export default function AboutGame() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".about-content > *", {
        scrollTrigger: { trigger: ref.current, start: "top 75%" },
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={ref} className="py-24 px-6">
      <div className="about-content max-w-4xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4">About the Game</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-8">A Dark Journey Within</h2>
        <p className="text-lg text-white/60 leading-relaxed mb-6">
          Hypocrisy is an action-adventure rogue-lite with deep RPG elements, set in a rich Science Fantasy universe.
          Players take on the role of a rebel fighter navigating a dystopian world ruled by a corrupt regime that
          controls humanity through suppression of the soul.
        </p>
        <p className="text-lg text-white/60 leading-relaxed mb-6">
          As you battle through procedurally influenced environments, you'll face not only external enemies but also the
          inner demons that mirror the very corruption you fight against. Every run brings new challenges, new
          revelations, and new opportunities for growth.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { label: "Genre", value: "Action Rogue-lite" },
            { label: "Setting", value: "Science Fantasy" },
            { label: "Perspective", value: "2D Side-scroll" },
            { label: "Platform", value: "PC (Steam)" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-lg bg-dark-800/50 border border-white/5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm text-white font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
