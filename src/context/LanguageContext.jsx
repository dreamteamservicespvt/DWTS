import { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import teTranslations from '../locales/te.json';

const LanguageContext = createContext();

const translations = {
  en: enTranslations,
  te: teTranslations,
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get from localStorage or default to English
    const savedLanguage = localStorage.getItem('dwts_language');
    return savedLanguage || import.meta.env.VITE_DEFAULT_LANGUAGE || 'en';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('dwts_language', language);
    
    // Update HTML lang attribute
    document.documentElement.lang = language;
    
    // Update font family for Telugu
    if (language === 'te') {
      document.documentElement.style.fontFamily = "'Noto Sans Telugu', 'Inter', sans-serif";
    } else {
      document.documentElement.style.fontFamily = "'Inter', sans-serif";
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'te' : 'en'));
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  // Helper function to get nested translation
  const getTranslation = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    // Replace parameters in translation
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.keys(params).forEach((param) => {
        value = value.replace(`{{${param}}}`, params[param]);
      });
    }

    return value || key;
  };

  const t = getTranslation;

  const value = {
    language,
    toggleLanguage,
    changeLanguage,
    t,
    isRTL: false, // Telugu is LTR (Left-to-Right)
    translations: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Convenience hook for translations only
export const useTranslation = () => {
  const { t, language } = useLanguage();
  return { t, language };
};

export default LanguageContext;
