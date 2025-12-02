"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { ThemeToggle } from "@/app/components/ui";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  showNav?: boolean;
}

export function Header({ title, showNav = true }: HeaderProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  
  const [userName, setUserName] = useState<string>("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    loadUserName();

    // Listen for auth state changes to update user name
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        loadUserName();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on Esc key
  useEffect(() => {
    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && showProfileDropdown) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileDropdown]);

  async function loadUserName() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Usar nome completo do user_metadata ou email como fallback
      const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
      setUserName(nome);
    } catch (error) {
      console.error("Erro ao carregar nome do usuário:", error);
    }
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/catalog", label: "Catálogo" },
    { href: "/timeline", label: "Timeline" },
    { href: "/biblioteca", label: "Biblioteca" },
    { href: "/editor", label: "Editor" },
    { href: "/upload", label: "Upload" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-raised/80 backdrop-blur-lg border-b border-border-light-default dark:border-border-dark-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Title or Navigation */}
          <div className="flex items-center gap-6">
            {title && (
              <h1 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
                {title}
              </h1>
            )}
            
            {showNav && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right: FAQ + Profile Dropdown */}
          <div className="flex items-center gap-3">
            <Link
              href="/faq"
              className="px-3 py-2 text-sm font-medium text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay rounded-lg transition-colors"
            >
              FAQ
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {showProfileDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden z-[70]">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        router.push('/profile');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar Perfil
                    </button>
                    
                    <ThemeToggle variant="dropdown" />
                    
                    <div className="border-t border-border-light-default dark:border-border-dark-default" />
                    
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/login');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error-light hover:bg-error-light/10 dark:text-error-light transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair da conta
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
