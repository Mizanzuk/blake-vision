"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Button, Input, Card, ThemeToggle, LocaleToggle } from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(t.auth.loginError, {
          description: error.message,
        });
        return;
      }

      if (data.user) {
        toast.success(t.common.success, {
          description: `${t.auth.welcomeBack}, ${data.user.email}`,
        });
        router.push("/");
      }
    } catch (error: any) {
      toast.error(t.auth.loginError, {
        description: error.message || t.errors.generic,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateAccount() {
    // Placeholder for future implementation
    toast.info(t.common.info, {
      description: "Funcionalidade em desenvolvimento. Em breve você poderá criar sua conta!",
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-light-base via-light-overlay to-light-raised dark:from-dark-base dark:via-dark-raised dark:to-dark-overlay">
      {/* Theme and Language toggles */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LocaleToggle />
      </div>

      {/* Logo and Title */}
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-5xl font-bold text-text-light-primary dark:text-dark-primary mb-3 tracking-tight">
          Blake Vision
        </h1>
        <p className="text-lg text-text-light-tertiary dark:text-dark-tertiary font-sans italic">
          Inspired by William Blake
        </p>
      </div>

      {/* Login Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="w-full max-w-md animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
            {t.auth.welcomeBack}
          </h2>
          <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
            {t.auth.loginSubtitle}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            fullWidth
            autoComplete="email"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <Input
            type="password"
            label={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            fullWidth
            autoComplete="current-password"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <span>Lembrar de mim</span>
            </label>
            <button
              type="button"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {t.auth.forgotPassword}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
          >
            {t.auth.login}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border-light-default dark:border-border-dark-default">
          <p className="text-center text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
            Ainda não tem uma conta?
          </p>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleCreateAccount}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            }
          >
            {t.auth.createAccount}
          </Button>
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-text-light-tertiary dark:text-dark-tertiary text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
        © 2025 Blake Vision. All rights reserved.
      </p>
    </div>
  );
}
