import { usePreferences } from "../stores/preferences";
import { ptBR } from "@/app/locales/pt-BR";
import { enUS } from "@/app/locales/en-US";

const translations = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

export function useTranslation() {
  const locale = usePreferences((state) => state.locale);
  const t = translations[locale];
  
  return { t, locale };
}
