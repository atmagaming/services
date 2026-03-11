"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const gamesSections = [
  { label: "About", id: "about" },
  { label: "Gameplay", id: "gameplay" },
  { label: "Universe", id: "universe" },
  { label: "Characters", id: "characters" },
  { label: "Art & Music", id: "art-music" },
  { label: "Roadmap", id: "roadmap" },
  { label: "Team", id: "team" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const pathname = usePathname();
  const isHypocrisy = pathname === "/games/hypocrisy" || pathname === "/games/hypocrisy/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-dark-950/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-[0.2em] text-white hover:text-accent-400 transition-colors"
        >
          ATMA
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {/* Games Dropdown */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: hover dropdown */}
          <div className="relative" onMouseEnter={() => setGamesOpen(true)} onMouseLeave={() => setGamesOpen(false)}>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
            >
              Games <ChevronDown className="w-3 h-3" />
            </button>
            {gamesOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-lg py-2 shadow-2xl">
                <Link
                  href="/games/hypocrisy"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setGamesOpen(false)}
                >
                  <img src="/assets/images/game-icon.jpeg" alt="" className="w-6 h-6 rounded" />
                  Hypocrisy
                </Link>
              </div>
            )}
          </div>

          {isHypocrisy &&
            gamesSections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {s.label}
              </button>
            ))}

          {!isHypocrisy && (
            <>
              <Link href="/#about" className="text-sm text-white/70 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/#contact" className="text-sm text-white/70 hover:text-white transition-colors">
                Contact
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-950/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
          <Link
            href="/games/hypocrisy"
            className="flex items-center gap-3 text-sm text-white/70 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/assets/images/game-icon.jpeg" alt="" className="w-6 h-6 rounded" />
            Hypocrisy
          </Link>
          {isHypocrisy &&
            gamesSections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className="block text-sm text-white/50 hover:text-white"
              >
                {s.label}
              </button>
            ))}
        </div>
      )}
    </nav>
  );
}
