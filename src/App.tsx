import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { open } from "@tauri-apps/api/dialog";
import {
  FileEntry,
  readDir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/api/fs";
import { basename, extname, join } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/api/shell";
import { register, unregisterAll } from "@tauri-apps/api/globalShortcut";
import { invoke } from "@tauri-apps/api";
import { appWindow } from "@tauri-apps/api/window";

import { Allotment, LayoutPriority } from "allotment";
import "allotment/dist/style.css";

import * as monaco from "monaco-editor";
import Editor, { loader } from "@monaco-editor/react";

import { init, format } from "wastyle";
import astyleBinaryUrl from "wastyle/dist/astyle.wasm?url";

import TitleBar from "./components/TitleBar";
import Splash from "./components/Splash";
import NewProject from "./components/NewProject";
import About from "./components/About";

import i18next from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { VscClose, VscPlay } from "react-icons/vsc";
import { themeFromSourceColor } from "@material/material-color-utilities/dist";
import Folder from "./components/Folder";

import { resources } from "./utils/i18n";
import { applyTheme, colors } from "./utils/materialTheme";
import { sendStats } from "./utils/analytics";
import FileIcon from "./components/FileIcon";

let zoomLevel = parseInt(localStorage.getItem("zoom")!) || 0;

function updateZoom(): number {
  localStorage.setItem("zoom", zoomLevel.toString());
  const zoomFactor = Math.pow(1.2, zoomLevel);
  invoke("zoom", { factor: zoomFactor });
  return zoomFactor;
}

document.oncontextmenu = (e) => e.preventDefault();

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

interface IColorContext {
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
}

interface IThemeContext {
  theme: string;
  setTheme: Dispatch<SetStateAction<string>>;
  darkTheme: boolean;
  setDarkTheme: Dispatch<SetStateAction<boolean>>;
  darkSystemThemeQuery: MediaQueryList;
}

export interface ICommand {
  title: string;
  shortcut?: string;
  action: (...args: any[]) => any;
  disabled?: boolean;
}

interface File {
  path: string;
  name: string;
  language: string;
  value: string;
}

interface IFileContext {
  openedFiles: File[];
  setOpenedFiles: Dispatch<SetStateAction<File[]>>;
  currentFileIndex: number;
  setCurrentFileIndex: Dispatch<SetStateAction<number>>;
}

export const ColorContext = createContext<IColorContext | null>(null);
export const ThemeContext = createContext<IThemeContext | null>(null);
export const CommandContext = createContext<Record<string, ICommand>>({});
export const FileContext = createContext<IFileContext | null>(null);

const darkSystemThemeQuery = matchMedia("(prefers-color-scheme: dark)");

loader.config({ monaco });

function App() {
  const { i18n, t } = useTranslation();

  const [color, setColor] = useState<string>(
    localStorage.getItem("color") || "blueAccent"
  );
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "system"
  );
  const [darkTheme, setDarkTheme] = useState<boolean>(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const logRef = useRef<HTMLTextAreaElement>(null);

  const [isSplashOpen, setIsSplashOpen] = useState<boolean>(true);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(true);

  const [currentProjectPath, setCurrentProjectPath] = useState<string>(
    localStorage.getItem("currentProjectPath")!
  );
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentProjectConfig, setCurrentProjectConfig] =
    useState<Record<string, string>>();
  const [openedFiles, setOpenedFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);

  const [isNewProjectOpen, setIsNewProjectOpen] = useState<boolean>(false);
  const [isOpenProjectOpen, setIsOpenProjectOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [status, setStatus] = useState<string>();

  function log(data: string) {
    if (logRef.current) {
      logRef.current.value += data + "\n";
      logRef.current?.scrollTo(0, logRef.current.scrollHeight);
    }
  }

  async function build(sourcePath: string, callback?: Function) {
    if (logRef.current) {
      setIsBuilding(true);
      log(`${t("status.compiling")}...`);
      setStatus(`${t("status.compiling")}...`);
      const program = await basename(
        sourcePath,
        `.${currentProjectConfig?.language}`
      );
      const binaryPath = await join(
        currentProjectPath,
        "build",
        `${program}.exe`
      );
      const command = new Command(`build_${await extname(sourcePath)}`, [
        "-g",
        sourcePath,
        "-o",
        binaryPath,
      ]);
      command.stderr.on("data", (data) => log(data));
      command.on("close", (data) => {
        setIsBuilding(false);
        setStatus("");
        if (data.code === 0) {
          sendStats("build");
          log(`${t("log.compilation.finished")} (${binaryPath}).`);
          callback!(binaryPath);
        } else {
          setIsLogOpen(true);
          log(`${t("log.compilation.failed")}.`);
          callback!();
        }
      });
      command.spawn();
    }
  }

  function run(binaryPath: string) {
    if (binaryPath) {
      setIsRunning(true);
      log(`${t("status.running")}...`);
      setStatus(`${t("status.running")}...`);
      const command = new Command("run", [
        binaryPath,
        "-batch",
        "-ex",
        '"set new-console on"',
        "-ex",
        "run",
      ]);
      command.stdout.on("data", (data) => log(data));
      command.on("close", () => {
        log(`${t("log.runningFinished")}.`);
        setIsRunning(false);
        setStatus("");
      });
      command.spawn();
    } else {
      setIsRunning(false);
    }
  }

  const command: Record<string, ICommand> = {
    new: {
      title: t("command.new"),
      shortcut: "CommandOrControl+N",
      action: () => setIsNewProjectOpen(true),
      disabled: isNewProjectOpen,
    },
    open: {
      title: t("command.open"),
      shortcut: "CommandOrControl+O",
      action: async () => {
        setIsOpenProjectOpen(true);
        const selected = await open({
          directory: true,
        });
        setIsOpenProjectOpen(false);
        if (typeof selected === "string") {
          setCurrentProjectPath(selected);
          setIsSplashOpen(false);
        }
      },
      disabled: isOpenProjectOpen,
    },
    save: {
      title: t("command.save"),
      shortcut: "CommandOrControl+S",
      action: async (callback: Function) => {
        if (logRef.current && editorRef.current && openedFiles.length > 0) {
          logRef.current.value = "";
          await editorRef.current
            .getAction("editor.action.formatDocument")
            .run();
          setIsSaving(true);
          log(`${t("status.saving")}...`);
          setStatus(`${t("status.saving")}...`);
          await writeTextFile(
            openedFiles[currentFileIndex].path,
            editorRef.current.getValue()
          );
          log(`${t("log.fileSaved")} (${openedFiles[currentFileIndex].path}).`);
          setIsSaving(false);
          setStatus("");
          if (callback) {
            callback();
          }
        }
      },
      disabled: openedFiles.length === 0 || isSaving,
    },
    build: {
      title: t("command.build"),
      shortcut: "CommandOrControl+B",
      action: async (callback?: Function) => {
        if (openedFiles.length > 0 && currentProjectConfig) {
          const sourcePath = await join(
            currentProjectPath,
            `${currentProjectConfig.mainProgram}.${currentProjectConfig.language}`
          );
          build(sourcePath, callback);
        }
      },
      disabled: !currentProjectConfig?.mainProgram || isBuilding,
    },
    run: {
      title: t("command.run"),
      shortcut: "CommandOrControl+R",
      action: () => {
        command.build.action((binaryPath: string) => run(binaryPath));
      },
      disabled: !currentProjectConfig?.mainProgram || isBuilding || isRunning,
    },
    runFile: {
      title: t("command.runFile"),
      shortcut: "Alt+F5",
      action: () => {
        if (openedFiles.length > 0) {
          build(openedFiles[currentFileIndex].path, (binaryPath: string) =>
            run(binaryPath)
          );
        }
      },
      disabled:
        !(
          currentFileIndex < openedFiles.length &&
          (openedFiles[currentFileIndex].name.endsWith(".c") ||
            openedFiles[currentFileIndex].name.endsWith(".cpp"))
        ) || isRunning,
    },
    log: {
      title: t("command.log"),
      shortcut: "CommandOrControl+`",
      action: () => setIsLogOpen((prevLogOpen) => !prevLogOpen),
    },
    about: {
      title: t("command.about"),
      action: () => {
        sendStats("view_about");
        setIsAboutOpen(true);
      },
      disabled: isAboutOpen,
    },
    zoomIn: {
      title: t("command.zoomIn"),
      shortcut: "CommandOrControl+=",
      action: () => {
        if (zoomLevel < 3) {
          zoomLevel++;
          const zoomFactor = updateZoom();
          log(
            `${t("command.zoomIn")} ${zoomFactor.toLocaleString("id-ID", {
              style: "percent",
            })}`
          );
        }
      },
    },
    zoomOut: {
      title: t("command.zoomOut"),
      shortcut: "CommandOrControl+-",
      action: () => {
        if (zoomLevel > -3) {
          zoomLevel--;
          const zoomFactor = updateZoom();
          invoke("zoom", { factor: zoomFactor });
          log(
            `${t("command.zoomOut")} ${zoomFactor.toLocaleString("id-ID", {
              style: "percent",
            })}`
          );
        }
      },
    },
    resetZoom: {
      title: t("command.resetZoom"),
      shortcut: "CommandOrControl+0",
      action: () => {
        zoomLevel = 0;
        const zoomFactor = updateZoom();
        log(
          `${t("command.resetZoom")} ${zoomFactor.toLocaleString("id-ID", {
            style: "percent",
          })}`
        );
      },
    },
  };

  function updateTheme() {
    const theme = darkTheme ? "dark" : "light";
    document.documentElement.className = theme;
    document.documentElement.style.colorScheme = theme;
  }

  function registerAllcommand() {
    Object.values(command).forEach((command) => {
      if (command.shortcut) {
        register(command.shortcut, command.action);
      }
    });
  }

  useEffect(() => {
    sendStats("start", { language: i18n.language, theme, color });
    init(astyleBinaryUrl);
    monaco.languages.registerDocumentFormattingEditProvider("cpp", {
      async provideDocumentFormattingEdits(model) {
        const [success, result] = format(model.getValue(), "pad-oper");
        log(`${t("status.formatting")}...`);
        if (success) {
          return [
            {
              range: model.getFullModelRange(),
              text: result,
            },
          ];
        }
      },
    });
    const zoomFactor = Math.pow(1.2, zoomLevel);
    invoke("zoom", { factor: zoomFactor });
    appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        registerAllcommand();
      } else {
        unregisterAll();
      }
    });
  }, []);

  useEffect(() => {
    const materialtheme = themeFromSourceColor(colors[color]);
    applyTheme(materialtheme, {
      target: document.documentElement,
      dark: darkTheme,
    });
    localStorage.setItem("color", color);
  }, [color, darkTheme]);

  useEffect(() => {
    if (theme === "system") {
      setDarkTheme(darkSystemThemeQuery.matches);
      localStorage.removeItem("theme");
      darkSystemThemeQuery.onchange = updateTheme;
    } else {
      setDarkTheme(theme === "dark");
      localStorage.setItem("theme", theme);
      darkSystemThemeQuery.onchange = null;
    }
  }, [theme]);

  useEffect(updateTheme, [darkTheme]);

  useEffect(() => {
    if (currentProjectPath) {
      localStorage.setItem("currentProjectPath", currentProjectPath);
      readDir(currentProjectPath).then(async (entries) => {
        setEntries([
          {
            path: currentProjectPath,
            name: currentProjectPath.substring(
              currentProjectPath.lastIndexOf("\\") + 1
            ),
            children: entries,
          },
        ]);
        const configFileName = "pub-code.json";
        const pubCodeJson = entries.find(
          (entry) => entry.name === configFileName
        );
        if (logRef.current && pubCodeJson) {
          logRef.current.value = "";
          log(`${t("status.reading")} ${configFileName}...`);
          const contents = await readTextFile(pubCodeJson.path);
          setCurrentProjectConfig(JSON.parse(contents));
        }
      });
    }
  }, [currentProjectPath]);

  useEffect(() => {
    if (currentProjectPath && currentProjectConfig?.mainProgram) {
      const mainProgramFileName = `${currentProjectConfig.mainProgram}.${currentProjectConfig.language}`;
      join(currentProjectPath, mainProgramFileName).then(async (path) => {
        log(`${t("log.openMainProgramFile")} (${mainProgramFileName})...`);
        const name = await basename(path);
        const value = await readTextFile(path);
        setOpenedFiles([
          {
            path,
            name,
            language: "cpp",
            value,
          },
        ]);
      });
    }
  }, [currentProjectConfig]);

  useEffect(() => {
    if (currentFileIndex >= openedFiles.length) {
      setCurrentFileIndex(0);
    }
  }, [openedFiles]);

  useEffect(() => {
    // onkeydown = (e) => {
    //   if (!(e.ctrlKey && e.key === "r")) {
    //     e.preventDefault();
    //     if (e.key === "F5") {
    //       command.run.action();
    //     }
    //   }
    // };
    registerAllcommand();
    return () => {
      // onkeydown = null;
      unregisterAll();
    };
  }, [currentFileIndex, openedFiles]);

  return (
    <ColorContext.Provider value={{ color, setColor }}>
      <ThemeContext.Provider
        value={{
          theme,
          setTheme,
          darkTheme,
          setDarkTheme,
          darkSystemThemeQuery,
        }}
      >
        <CommandContext.Provider value={command}>
          <FileContext.Provider
            value={{
              openedFiles,
              setOpenedFiles,
              currentFileIndex,
              setCurrentFileIndex,
            }}
          >
            <div className="flex flex-col h-screen bg-surface1 text-on-surface">
              <TitleBar
                currentProjectPath={currentProjectPath}
                menu={[
                  command.new,
                  command.open,
                  command.save,
                  command.build,
                  command.run,
                  command.log,
                  command.about,
                ]}
              />
              <div className="flex-grow relative">
                <Allotment
                  proportionalLayout={false}
                  separator={false}
                  onChange={(sizes) => {
                    if (sizes[0]) {
                      localStorage.setItem("sideBarWidth", sizes[0].toString());
                    }
                  }}
                >
                  <Allotment.Pane
                    preferredSize={localStorage.getItem("sideBarWidth") || 200}
                    priority={LayoutPriority.Low}
                  >
                    <div className="flex flex-col h-full">
                      <header>{t("explorer.title")}</header>
                      <div className="flex flex-col flex-grow overflow-y-auto">
                        {entries.map((entry) => (
                          <Folder
                            key={entry.path}
                            path={entry.path}
                            name={entry.name}
                            autoFetchChildren={true}
                          />
                        ))}
                      </div>
                    </div>
                  </Allotment.Pane>
                  <Allotment proportionalLayout={false} vertical>
                    <div className="h-full flex flex-col bg-surface">
                      <div
                        className={`flex gap-1 ${
                          openedFiles.length > 0 && "bg-surface1"
                        }`}
                      >
                        <span className="flex flex-grow gap-[1px]">
                          {openedFiles.map((file, index) => (
                            <span
                              key={index}
                              className={`button px-3 flex items-center gap-2 bg-surface1 rounded-t-lg max-w-xs ${
                                index === currentFileIndex &&
                                "!bg-none !bg-surface"
                              }`}
                              style={{
                                width: `${(1 / openedFiles.length) * 100}%`,
                              }}
                              onClick={() => setCurrentFileIndex(index)}
                              title={file.path}
                            >
                              <FileIcon name={file.name} />
                              <span className="flex-grow whitespace-nowrap overflow-ellipsis overflow-hidden">
                                {file.name}
                              </span>
                              <button
                                className="w-6 h-6 rounded-full flex justify-center text-xl -mr-1"
                                onClick={() => {
                                  setOpenedFiles(
                                    openedFiles.filter(
                                      (f) => f.path !== file.path
                                    )
                                  );
                                }}
                              >
                                <VscClose />
                              </button>
                            </span>
                          ))}
                        </span>
                        <button
                          className="h-10 flex gap-2 px-4 text-primary"
                          onClick={command.runFile.action}
                          disabled={command.runFile.disabled}
                        >
                          <VscPlay />
                          {t("command.runFile")}
                        </button>
                      </div>
                      {currentFileIndex < openedFiles.length && (
                        <Editor
                          path={openedFiles[currentFileIndex].path}
                          defaultLanguage={
                            openedFiles[currentFileIndex].language
                          }
                          defaultValue={openedFiles[currentFileIndex].value}
                          theme={darkTheme ? "vs-dark" : "vs"}
                          onMount={(editor) => (editorRef.current = editor)}
                          onChange={async (value) => {
                            if (value) {
                              await writeTextFile(
                                openedFiles[currentFileIndex].path,
                                value
                              );
                            }
                          }}
                        />
                      )}
                    </div>
                    <Allotment.Pane
                      preferredSize={200}
                      priority={LayoutPriority.Low}
                      visible={isLogOpen}
                    >
                      <div className="flex flex-col h-full bg-surface">
                        <header>
                          Log
                          <button
                            className="w-6 h-6 rounded-full flex justify-center text-xl -mr-2"
                            onClick={() => setIsLogOpen(false)}
                          >
                            <VscClose />
                          </button>
                        </header>
                        <textarea
                          readOnly
                          spellCheck="false"
                          className="bg-transparent outline-none flex-grow font-mono resize-none px-6"
                          ref={logRef}
                        />
                      </div>
                    </Allotment.Pane>
                  </Allotment>
                </Allotment>
                <Splash isOpen={isSplashOpen} setOpen={setIsSplashOpen} />
                <NewProject
                  isOpen={isNewProjectOpen}
                  setIsOpen={setIsNewProjectOpen}
                  onCreate={(location: string) => {
                    setCurrentProjectPath(location);
                    setIsSplashOpen(false);
                  }}
                />
                <About isOpen={isAboutOpen} setIsOpen={setIsAboutOpen} />
              </div>
              <div className="bg-surface5 h-8 flex items-center px-4">
                {status}
              </div>
            </div>
          </FileContext.Provider>
        </CommandContext.Provider>
      </ThemeContext.Provider>
    </ColorContext.Provider>
  );
}

export default App;
