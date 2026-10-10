import { useTranslation } from "react-i18next";
import ChatBox from "../components/ChatBox";
import LanguageSwitcher from "../components/LanguageSwitcher";

const CitizenPage = () => {
  const { t } = useTranslation();

  return (
    <div className="citizen-page">
      <header className="citizen-header">
        <h1>{t("appTitle")}</h1>
        <p>{t("appSubtitle")}</p>
        <LanguageSwitcher />
      </header>

      <main className="citizen-main">
        <ChatBox language="ta" />
      </main>
    </div>
  );
};

export default CitizenPage;