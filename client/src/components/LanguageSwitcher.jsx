import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", label: "English" },
    { code: "ta", label: "தமிழ்" },
    { code: "hi", label: "हिन्दी" },
  ];

  return (
    <div className="language-switcher" aria-label="Choose language">
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          className={
            i18n.language === language.code ? "active" : ""
          }
          onClick={() => i18n.changeLanguage(language.code)}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;