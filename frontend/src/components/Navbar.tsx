"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Compass } from "lucide-react";

interface NavbarProps {
  onScanClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScanClick }) => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/observatory");
  const isHome = pathname === "/";
  const isTeam = pathname.startsWith("/team");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = isDashboard
    ? [
        { href: "/dashboard", label: "Dashboard", active: isDashboard },
        { href: "/team", label: "Team", active: isTeam },
        { href: "/", label: "Home", active: isHome },
      ]
    : [
        { href: "/", label: "Home", active: isHome },
        { href: "/dashboard", label: "Dashboard", active: isDashboard },
        { href: "/team", label: "Team", active: isTeam },
      ];

  return (
    <>
      <header
        className={`no-print sticky top-0 z-50 transition-all duration-300 ease-out ${
          scrolled
            ? "h-12 bg-surface/95 backdrop-blur-md border-b border-strata-mid shadow-[0_1px_3px_rgba(27,36,50,0.06)]"
            : "h-16 bg-surface border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            {/* Logo mark — stylized water ripple */}
            <div
              className={`flex items-center justify-center rounded-lg bg-reservoir text-white font-heading font-bold transition-all duration-300 ${
                scrolled ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
              }`}
            >
              नी
            </div>
            <div className="flex flex-col">
              <span
                className={`font-heading font-semibold text-basalt tracking-tight transition-all duration-300 ${
                  scrolled ? "text-sm" : "text-base"
                }`}
              >
                NeerDrishti
              </span>
              {!scrolled && (
                <span className="text-[11px] text-basalt-light/60 hidden sm:block leading-none">
                  Watershed Verification
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  link.active
                    ? "text-reservoir font-semibold"
                    : "text-basalt-light hover:text-basalt"
                }`}
              >
                {link.label}
                {link.active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-reservoir rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            {/* CTA button */}
            {isDashboard && onScanClick ? (
              <button
                onClick={onScanClick}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-reservoir hover:bg-reservoir-light text-white text-[13px] font-medium transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore a Site</span>
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-reservoir hover:bg-reservoir-light text-white text-[13px] font-medium transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore a Site</span>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-basalt-light hover:text-basalt hover:bg-strata transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Full-Screen Menu ──────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-basalt/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel — slides from right */}
          <div className="absolute right-0 top-0 bottom-0 w-[min(320px,85vw)] bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Close button */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-strata">
              <span className="font-heading font-semibold text-basalt">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-basalt-light hover:text-basalt hover:bg-strata transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                    link.active
                      ? "bg-reservoir-faint text-reservoir font-semibold border-l-[3px] border-reservoir"
                      : "text-basalt-light hover:text-basalt hover:bg-strata"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Bottom CTA */}
            <div className="px-4 pb-6 pt-2 border-t border-strata">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-reservoir hover:bg-reservoir-light text-white text-[15px] font-semibold transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Explore a Site</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
