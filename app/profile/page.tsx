"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  ThemeToggle, 
  LocaleToggle,
  Loading 
} from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { usePreferences } from "@/app/lib/stores/preferences";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, locale } = usePreferences();
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error(t.errors.generic);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) {
        toast.error(t.errors.generic, {
          description: error.message,
        });
        return;
      }

      toast.success(t.success.updated, {
        description: t.profile.profileUpdated,
      });
    } catch (error: any) {
      toast.error(t.errors.generic, {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t.errors.validation, {
        description: "As senhas não coincidem",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t.errors.validation, {
        description: "A senha deve ter no mínimo 6 caracteres",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(t.errors.generic, {
          description: error.message,
        });
        return;
      }

      toast.success(t.success.updated, {
        description: t.profile.passwordChanged,
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(t.errors.generic, {
        description: error.message,
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      {/* Header */}
      <header className="border-b border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium">{t.common.back}</span>
          </button>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
            {t.profile.title}
          </h1>
          <p className="text-text-light-tertiary dark:text-dark-tertiary">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title={t.profile.personalInfo}
              description="Atualize seus dados pessoais"
            />
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label={t.profile.fullName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                fullWidth
              />

              <Input
                type="email"
                label={t.profile.email}
                value={email}
                disabled
                fullWidth
                helperText="O e-mail não pode ser alterado"
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSaving}
                >
                  {t.profile.saveChanges}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title={t.profile.changePassword}
              description="Atualize sua senha de acesso"
            />
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                label={t.profile.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                fullWidth
              />

              <Input
                type="password"
                label={t.profile.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                fullWidth
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isChangingPassword}
                >
                  {t.profile.changePassword}
                </Button>
              </div>
            </form>
          </Card>

          {/* Preferences */}
          <Card variant="elevated" padding="lg">
            <CardHeader
              title={t.profile.preferences}
              description="Personalize sua experiência"
            />
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-3">
                  {t.profile.theme}
                </label>
                <div className="flex items-center gap-4">
                  <ThemeToggle showLabel />
                  <span className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                    {theme === "dark" ? t.profile.darkMode : t.profile.lightMode}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-3">
                  {t.profile.language}
                </label>
                <div className="flex items-center gap-4">
                  <LocaleToggle showLabel />
                </div>
              </div>
            </div>
          </Card>

          {/* Logout */}
          <Card variant="outlined" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-light-primary dark:text-dark-primary mb-1">
                  Sair da conta
                </h3>
                <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                  Encerrar sua sessão atual
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleLogout}
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                }
              >
                {t.auth.logout}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
