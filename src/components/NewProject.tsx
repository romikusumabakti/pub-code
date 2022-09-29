import { open } from "@tauri-apps/api/dialog";
import { createDir, readDir, writeTextFile } from "@tauri-apps/api/fs";
import { documentDir, join } from "@tauri-apps/api/path";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VscFolderOpened } from "react-icons/vsc";
import { sendStats } from "../utils/analytics";
import Button from "./Button";
import Dialog from "./Dialog";
import RadioButton from "./RadioButton";
import helloWorldC from "../templates/main.c?raw";
import helloWorldCpp from "../templates/main.cpp?raw";
import helloWorldWithConuiC from "../templates/with-conui/main.c?raw";
import helloWorldWithConuiCpp from "../templates/with-conui/main.cpp?raw";
import conuiH from "../templates/with-conui/conui.h?raw";

type LanguageId = "c" | "cpp" | "carbon";

interface Language {
  id: LanguageId;
  name: string;
  disabled?: boolean;
}

const languages: Language[] = [
  {
    id: "c",
    name: "C",
  },
  {
    id: "cpp",
    name: "C++",
  },
  {
    id: "carbon",
    name: "Carbon",
    disabled: true,
  },
];

const helloWorld = {
  c: helloWorldC,
  cpp: helloWorldCpp,
  carbon: "",
};

const helloWorldWithConui = {
  c: helloWorldWithConuiC,
  cpp: helloWorldWithConuiCpp,
  carbon: "",
};

interface NewProjectProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onCreate: (location: string) => void;
}

interface Configuration {
  name: string;
  version: string;
  language: LanguageId;
  mainProgram: string;
}

function NewProject({ isOpen, setIsOpen, onCreate }: NewProjectProps) {
  const { t } = useTranslation();

  const [configuration, setConfiguration] = useState<Configuration>({
    name: "project-1",
    version: "0.1.0",
    language: "c",
    mainProgram: "./main",
  });
  const [location, setLocation] = useState<string>("");
  const [initHelloWorld, setInitHelloWorld] = useState<boolean>(false);
  const [initConui, setInitConui] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      documentDir().then(async (documentDir) => {
        const pubCodePath = await join(documentDir, "pub-code");
        setLocation(pubCodePath);
        let projectNumber = 1;
        while (true) {
          const projectName = `project-${projectNumber}`;
          const projectPath = await join(pubCodePath, projectName);
          try {
            await readDir(projectPath);
            projectNumber++;
          } catch (error) {
            setConfiguration({
              ...configuration,
              name: projectName,
            });
            break;
          }
        }
      });
    }
  }, [isOpen]);

  return (
    <Dialog
      className="w-[512px]"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <h1 className="text-xl">{t("newProject.title")}</h1>
      <form
        className="flex flex-col"
        onSubmit={async (e) => {
          e.preventDefault();
          const projectPath = await join(location, configuration.name);
          await createDir(await join(projectPath, "build"), {
            recursive: true,
          });
          await writeTextFile(
            await join(projectPath, "pub-code.json"),
            JSON.stringify(configuration, null, 2)
          );
          const mainProgramPath = await join(
            projectPath,
            `${configuration.mainProgram}.${configuration.language}`
          );
          if (initConui) {
            await writeTextFile(
              mainProgramPath,
              initHelloWorld ? helloWorldWithConui[configuration.language] : ""
            );
            await createDir(await join(projectPath, "libs"), {
              recursive: true,
            });
            await writeTextFile(
              await join(projectPath, "libs", "conui.h"),
              conuiH
            );
          } else {
            await writeTextFile(
              mainProgramPath,
              initHelloWorld ? helloWorld[configuration.language] : ""
            );
          }
          onCreate(projectPath);
          setIsOpen(false);
          sendStats("create_project", configuration);
        }}
      >
        <div className="flex flex-col divide-y divide-outline">
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center">
              <span className="w-32">{t("name")}</span>
              <input
                type="text"
                value={configuration.name}
                onChange={(e) =>
                  setConfiguration({ ...configuration, name: e.target.value })
                }
                required
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="flex items-center">
              <span className="w-32">{t("newProject.location")}</span>
              <span className="flex-grow flex relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <button
                  className="w-8 h-8 flex justify-center absolute right-0"
                  type="button"
                  onClick={() => {
                    open({
                      defaultPath: location,
                      directory: true,
                    }).then((path) => {
                      if (typeof path === "string") {
                        setLocation(path);
                      }
                    });
                  }}
                >
                  <VscFolderOpened />
                </button>
              </span>
            </div>
            <div className="flex">
              <span className="w-32">{t("newProject.language")}</span>
              {languages.map((language) => (
                <RadioButton
                  key={language.id}
                  name="language"
                  checked={language.id === configuration.language}
                  onChange={(e) =>
                    setConfiguration({
                      ...configuration,
                      language: language.id,
                    })
                  }
                  disabled={language.disabled}
                >
                  {language.name}
                </RadioButton>
              ))}
            </div>
            <div className="flex items-center">
              <span className="w-32">{t("newProject.mainProgram")}</span>
              <input
                type="text"
                value={configuration.mainProgram}
                onChange={(e) =>
                  setConfiguration({
                    ...configuration,
                    mainProgram: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="flex items-center">
              <span className="w-32">{t("newProject.compilerPath")}</span>
              <input type="text" value="C:\mingw64\bin" required />
            </div>
          </div>
          <div className="flex flex-col gap-1 py-4">
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={initHelloWorld}
                onChange={(e) => setInitHelloWorld(e.target.checked)}
              />
              {t("newProject.initialize")} Hello World
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={initConui}
                onChange={(e) => setInitConui(e.target.checked)}
              />
              {t("newProject.initialize")}{" "}
              {t("aLibrary", { library: "Console UI" })} (conui.h)
            </label>
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <Button>{t("create")}</Button>
          <Button type="reset" variant="tonal" onClick={() => setIsOpen(false)}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default NewProject;
