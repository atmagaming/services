"use client";

import { Music, Palette } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

export default function ArtMusic() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".art-section > *", {
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
    <section id="art-music" ref={ref} className="py-24 px-6">
      <div className="art-section max-w-6xl mx-auto">
        <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 text-center">Art & Music</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-16 text-center">Crafted with Soul</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Art Style */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-accent-400" />
              <h3 className="text-xl font-semibold text-white">Art Direction</h3>
            </div>
            <p className="text-white/50 mb-6 leading-relaxed">
              A distinctive blend of dark, atmospheric environments with vibrant energy effects. Hand-crafted pixel art
              meets modern lighting — creating a visual language that is both nostalgic and fresh.
            </p>
            {/* Art placeholder grid */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-gradient-to-br from-dark-700 to-dark-800 border border-white/5 flex items-center justify-center"
                >
                  <span className="text-xs text-white/20">Concept Art {i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Music */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-6 h-6 text-accent-400" />
              <h3 className="text-xl font-semibold text-white">Soundtrack</h3>
            </div>
            <p className="text-white/50 mb-6 leading-relaxed">
              An original soundtrack that weaves orchestral grandeur with electronic textures. Each world has its own
              sonic identity — from haunting ambient pieces to pulse-pounding battle themes.
            </p>
            {/* Music placeholder */}
            <div className="space-y-3">
              {["Main Theme", "World of Greed", "Battle Anthem", "Reflection"].map((track) => (
                <div
                  key={track}
                  className="flex items-center gap-4 p-4 rounded-lg bg-dark-800/50 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-600/20 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{track}</p>
                    <p className="text-xs text-white/30">Coming soon</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
