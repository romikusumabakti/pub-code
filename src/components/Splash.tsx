import { Dispatch, SetStateAction, useContext } from "react";
import { MdDarkMode, MdLanguage, MdLightMode, MdPalette } from "react-icons/md";
import { ColorContext, CommandContext, Theme, ThemeContext } from "../App";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Dialog from "./Dialog";
import { VscClose } from "react-icons/vsc";
import { AboutFooter, AboutHeader } from "./About";
import { sendStats } from "../utils/analytics";
import { colors } from "../utils/materialTheme";

interface SplashProps {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function Splash({ isOpen, setOpen }: SplashProps) {
  const { t, i18n } = useTranslation();
  const { color, setColor } = useContext(ColorContext) || {};
  const { theme, setTheme } = useContext(ThemeContext) || {};
  const command = useContext(CommandContext);

  return (
    <Dialog
      className="flex flex-col gap-6 relative w-[512px]"
      isOpen={isOpen}
      onClose={() => setOpen(false)}
    >
      <AboutHeader />
      <AboutFooter />
      <div className="flex gap-4 [&>*]:flex-1 [&>*]:flex [&>*]:flex-col [&>*]:gap-1">
        <label>
          <div className="flex gap-2 items-center">
            <MdLanguage />
            <span>{t("language")}</span>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => {
              sendStats("select_language", { language: e.target.value });
              i18n.changeLanguage(e.target.value);
            }}
          >
            {[
              {
                id: "en",
                name: "English",
              },
              {
                id: "id",
                name: "Bahasa Indonesia",
              },
            ].map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="flex gap-2 items-center">
            <MdPalette />
            <span>{t("color.title")}</span>
          </div>
          <select
            value={color}
            onChange={(e) => {
              sendStats("select_color", { color: e.target.value });
              setColor!(e.target.value);
            }}
          >
            {Object.entries(colors).map((color) => (
              <option
                key={color[0]}
                value={color[0]}
                style={{ color: color[1] }}
              >
                {t(`color.${color[0]}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="flex gap-2 items-center">
            {theme === "dark" ? <MdDarkMode /> : <MdLightMode />}
            <span>{t("theme.title")}</span>
          </div>
          <select
            value={theme}
            onChange={(e) => {
              sendStats("select_theme", { theme: e.target.value });
              setTheme!(e.target.value as Theme);
            }}
          >
            {["system", "light", "dark"].map((theme) => (
              <option key={theme} value={theme}>
                {t(`theme.${theme}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <span className="flex gap-4">
        <Button variant="tonal" onClick={command.about.action}>
          {t("command.about")}
        </Button>
        <Button className="ml-auto" onClick={command.new.action}>
          {t("command.new")}
        </Button>
        <Button onClick={command.open.action}>{t("command.open")}</Button>
      </span>
      <button
        className="w-10 h-10 rounded-full text-2xl ml-auto flex items-center justify-center absolute top-6 right-6"
        onClick={() => setOpen(false)}
      >
        <VscClose />
      </button>
    </Dialog>
  );
}

export default Splash;
