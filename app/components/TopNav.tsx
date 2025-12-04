"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { clsx } from "clsx";

interface TopNavProps {
  currentPage?: "home" | "catalog" | "timeline" | "biblioteca" | "editor" | "upload" | "faq";
}

export function TopNav({ currentPage }: TopNavProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    { id: "home", label: "Home", href: "/" },
    { id: "catalog", label: "Catálogo", href: "/catalog" },
    { id: "timeline", label: "Timeline", href: "/timeline" },
    { id: "biblioteca", label: "Biblioteca", href: "/biblioteca" },
    { id: "editor", label: "Editor", href: "/editor" },
    { id: "upload", label: "Upload", href: "/upload" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 bg-[#F5F1E8] dark:bg-dark-raised">
        {/* Left: Navigation Links */}
        <div className="flex items-center gap-6">
          {navLinks.filter(link => link.id !== currentPage).map((link) => (
            <button
              key={link.id}
              onClick={() => router.push(link.href)}
              className={clsx(
                "text-sm font-medium transition-colors",
                currentPage === link.id
                  ? "text-primary-500 border-b-2 border-primary-500 pb-1"
                  : "text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary"
              )}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right: FAQ + User Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/faq")}
            className={clsx(
              "text-sm font-medium transition-colors",
              currentPage === "faq"
                ? "text-primary-500"
                : "text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary"
            )}
          >
            FAQ
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
            >
              <svg
                className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <svg
                className={clsx(
                  "w-4 h-4 text-text-light-secondary dark:text-dark-secondary transition-transform",
                  isUserMenuOpen && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar Perfil
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error-light hover:bg-error-light/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="md:hidden flex items-center justify-between px-4 py-3 bg-[#F5F1E8] dark:bg-dark-raised">
        {/* Hamburger Menu */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
        >
          <svg
            className="w-6 h-6 text-text-light-secondary dark:text-dark-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Title */}
        <h1 className="text-lg font-bold text-text-light-primary dark:text-dark-primary">Blake Vision</h1>

        {/* User Menu */}
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
        >
          <svg
            className="w-6 h-6 text-text-light-secondary dark:text-dark-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-raised border-r border-border-light-default dark:border-border-dark-default z-50 p-4">
            <div className="space-y-2">
              {navLinks.filter(link => link.id !== currentPage).map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push(link.href);
                  }}
                  className={clsx(
                    "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    currentPage === link.id
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-500"
                      : "text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay"
                  )}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/faq");
                }}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  currentPage === "faq"
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-500"
                    : "text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay"
                )}
              >
                FAQ
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile User Menu Dropdown */}
      {isUserMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsUserMenuOpen(false)}
          />
          <div className="md:hidden fixed top-14 right-4 w-48 bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden z-50">
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                router.push("/profile");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar Perfil
            </button>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error-light hover:bg-error-light/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </button>
          </div>
        </>
      )}
    </>
  );
}
