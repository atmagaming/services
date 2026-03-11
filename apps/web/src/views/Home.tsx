"use client";

import { ArrowRight, ChevronDown, Eye, Heart, Lightbulb, Mail, Shield, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { type RefObject, useEffect, useRef } from "react";
import gsap from "@/lib/gsap";

const values = [
  { icon: Heart, label: "Love", description: "The foundation of everything we create" },
  { icon: Sparkles, label: "Kindness", description: "Reflected in every interaction" },
  { icon: Eye, label: "Honesty", description: "Truth in storytelling and craft" },
  { icon: Lightbulb, label: "Wisdom", description: "Meaningful choices, lasting impact" },
  { icon: Shield, label: "Courage", description: "Bold ideas, fearless creation" },
  { icon: Users, label: "Unity", description: "Together we build worlds" },
];

function useReveal(ref: RefObject<HTMLElement | null>, threshold = 0.15) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
}

export default function Home() {
  const missionRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useReveal(missionRef);
  useReveal(valuesRef);
  useReveal(gameRef);
  useReveal(contactRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", { y: 40, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.from(".hero-tagline", { y: 30, opacity: 0, duration: 1, delay: 0.3, ease: "power3.out" });
      gsap.from(".hero-cta", { y: 20, opacity: 0, duration: 0.8, delay: 0.6, ease: "power3.out" });
      gsap.from(".hero-scroll", { opacity: 0, duration: 0.8, delay: 1, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-accent-600)_0%,transparent_70%)] opacity-[0.08]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent-500)_0%,transparent_50%)] opacity-[0.05]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-gold-500)_0%,transparent_50%)] opacity-[0.03]" />

        <div className="text-center px-6 relative z-10">
          <h1 className="hero-title font-display text-7xl md:text-9xl font-bold tracking-[0.15em] text-white mb-6">
            ATMA
          </h1>
          <p className="hero-tagline text-xl md:text-2xl text-white/60 max-w-xl mx-auto mb-12 font-light">
            Igniting light within hearts through games
          </p>
          <Link
            href="/games/hypocrisy"
            className="hero-cta inline-flex items-center gap-2 px-8 py-3.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors text-sm font-medium hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            Explore Hypocrisy <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="hero-scroll absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* Mission */}
      <section id="about" className="py-32 px-6">
        <div ref={missionRef} className="reveal-section max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-8">Our Mission</h2>
          <p className="text-lg text-white/60 leading-relaxed">
            At ATMA, we believe games have the power to transform. We craft experiences that challenge players to look
            within, confront their shadows, and discover the light that resides in every soul. Through compelling
            narratives and meaningful gameplay, we aim to ignite a spark of self-awareness and compassion.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-linear-to-b from-dark-900/50 via-dark-900/30 to-transparent" />
        <div ref={valuesRef} className="reveal-section max-w-5xl mx-auto relative z-10">
          <h2 className="font-display text-3xl md:text-4xl text-white text-center mb-16">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div
                key={v.label}
                className="reveal-child p-8 rounded-2xl bg-dark-800/40 border border-white/6 hover:border-accent-500/30 transition-all duration-300 hover:bg-dark-800/60 group"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent-600/10 flex items-center justify-center mb-5 group-hover:bg-accent-600/20 transition-colors">
                  <v.icon className="w-6 h-6 text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{v.label}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Highlight */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--color-accent-600)_0%,transparent_70%)] opacity-[0.06]" />
        <div ref={gameRef} className="reveal-section max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="reveal-child lg:w-1/2 shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-accent-600/10 border border-white/6">
                <img
                  src="/assets/images/game-icon.jpeg"
                  alt="Hypocrisy"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-dark-950/60 to-transparent" />
              </div>
            </div>

            <div className="reveal-child lg:w-1/2 text-center lg:text-left" style={{ transitionDelay: "150ms" }}>
              <p className="text-sm text-accent-400 uppercase tracking-widest mb-4 font-medium">Featured Game</p>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6">HYPOCRISY</h2>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Fight the regime. Confront your soul. An action-adventure rogue-lite set in a dark Science Fantasy
                world.
              </p>
              <Link
                href="/games/hypocrisy"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-accent-500/50 text-accent-400 hover:bg-accent-600 hover:text-white hover:border-accent-600 rounded-lg transition-all text-sm font-medium"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-dark-900/50 to-dark-900/30" />
        <div ref={contactRef} className="reveal-section max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-accent-600/10 items-center justify-center mb-8">
            <Mail className="w-6 h-6 text-accent-400" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">Get in Touch</h2>
          <p className="text-white/50 mb-10 text-lg">Interested in collaborating or have questions? Reach out to us.</p>
          <a
            href="mailto:ceo@atmagaming.com"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-dark-700/80 hover:bg-dark-600 text-white rounded-lg transition-all text-sm border border-white/6 hover:border-white/10"
          >
            <Mail className="w-4 h-4 text-white/50" />
            ceo@atmagaming.com
          </a>
        </div>
      </section>
    </div>
  );
}
