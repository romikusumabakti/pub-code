import { appWindow } from "@tauri-apps/api/window";
import { useContext, useEffect, useState } from "react";
import { MdDarkMode, MdLightMode, MdSchool } from "react-icons/md";
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import { FileContext, ICommand, ThemeContext } from "../App";
import { useTranslation } from "react-i18next";

interface TitleBarProps {
  menu: ICommand[];
}

function TitleBar({ menu }: TitleBarProps) {
  const { i18n } = useTranslation();
  const { theme, setTheme, darkTheme, darkThemeMediaQueryList } =
    useContext(ThemeContext) || {};
  const [isMaximized, setIsMaximized] = useState<boolean>();
  const { currentProjectPath, openedFiles, currentFileIndex } =
    useContext(FileContext) || {};

  async function updateIsMaximized() {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      setIsMaximized(true);
    } else {
      setIsMaximized(false);
    }
  }

  useEffect(() => {
    appWindow.onResized(updateIsMaximized);
    updateIsMaximized();
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="flex h-10 bg-surface5 gap-8 [&>*]:flex-1"
    >
      <span data-tauri-drag-region className="flex">
        <span
          data-tauri-drag-region
          className="flex items-center text-2xl pl-3 pr-2 text-primary"
        >
          <MdSchool className="pointer-events-none" />
        </span>
        <span className="flex [&>*]:px-3">
          {menu.map((button: ICommand) => (
            <button
              key={button.title}
              onClick={button.action}
              disabled={button.disabled}
              title={button.shortcut?.replace("CommandOrControl", "Ctrl")}
            >
              {button.title}
            </button>
          ))}
        </span>
      </span>
      <span
        data-tauri-drag-region
        className="whitespace-nowrap overflow-ellipsis overflow-hidden self-center text-center"
      >
        {[
          openedFiles &&
            typeof currentFileIndex === "number" &&
            openedFiles.length > 0 &&
            openedFiles[currentFileIndex]?.name,
          currentProjectPath?.substring(
            currentProjectPath.lastIndexOf("\\") + 1
          ),
          "PUB Code",
        ]
          .filter((s) => s)
          .join(" - ")}
      </span>
      <span
        data-tauri-drag-region
        className="flex text-[16px] justify-end [&>*]:w-14 [&>*]:justify-center"
      >
        <button
          className="text-primary text-[13px]"
          onClick={() =>
            i18n.changeLanguage(i18n.language === "en" ? "id" : "en")
          }
        >
          {i18n.language.toUpperCase()}
        </button>
        <button
          className="text-primary"
          onClick={() => {
            if (theme === "system") {
              setTheme!(darkTheme ? "light" : "dark");
            } else if (theme === "light") {
              setTheme!(darkThemeMediaQueryList!.matches ? "system" : "dark");
            } else if (theme === "dark") {
              setTheme!(darkThemeMediaQueryList!.matches ? "light" : "system");
            }
          }}
        >
          {darkTheme ? <MdLightMode /> : <MdDarkMode />}
        </button>
        <button onClick={() => appWindow.minimize()}>
          <VscChromeMinimize />
        </button>
        {isMaximized ? (
          <button onClick={() => appWindow.unmaximize()}>
            <VscChromeRestore />
          </button>
        ) : (
          <button onClick={() => appWindow.maximize()}>
            <VscChromeMaximize />
          </button>
        )}
        <button onClick={() => appWindow.close()}>
          <VscChromeClose />
        </button>
      </span>
    </div>
  );
}

export default TitleBar;
