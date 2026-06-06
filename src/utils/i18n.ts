const languages = {
  en: {
    title: "PRODUCTION ENVIRONMENT",
    warning: "You are attempting a ",
    methodLabel: " request to a production environment.",
    buttonProceed: "PROCEED WITH ACTION",
    buttonCancel: "Cancel and Abort"
  },
  id: {
    title: "LINGKUNGAN PRODUKSI",
    warning: "Anda mencoba melakukan request ",
    methodLabel: " ke lingkungan produksi.",
    buttonProceed: "LANJUTKAN EKSEKUSI",
    buttonCancel: "Batalkan"
  }
};

// Ubah 'en' menjadi 'id' jika ingin default ke Bahasa Indonesia
type LanguageKey = keyof typeof languages.en;
const currentLang = 'en'; 

export const t = (key: LanguageKey): string => {
  return languages[currentLang][key];
};