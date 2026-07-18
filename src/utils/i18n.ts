const languages = {
  en: {
    title: "PRODUCTION ENVIRONMENT",
    warning: "You are attempting a ",
    methodLabel: " request to a production environment.",
    buttonProceed: "PROCEED WITH ACTION",
    buttonCancel: "Cancel and Abort",
  },
  id: {
    title: "LINGKUNGAN PRODUKSI",
    warning: "Anda mencoba melakukan request ",
    methodLabel: " ke lingkungan produksi.",
    buttonProceed: "LANJUTKAN EKSEKUSI",
    buttonCancel: "Batalkan",
  },
};

export type LanguageKey = keyof typeof languages.en;
export type Language = keyof typeof languages;

const DEFAULT_LANG: Language = "en";

let currentLang: Language = DEFAULT_LANG;

export const setLanguage = (lang: Language): void => {
  if (lang in languages) {
    currentLang = lang;
  }
};

export const getLanguage = (): Language => currentLang;

export const t = (key: LanguageKey): string => {
  return languages[currentLang][key];
};
