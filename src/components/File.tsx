import {
  exists,
  readTextFile,
  removeFile,
  renameFile,
  writeTextFile,
} from "@tauri-apps/api/fs";
import { basename, extname, join } from "@tauri-apps/api/path";
import { ButtonHTMLAttributes, useContext, useEffect, useState } from "react";
import { FileContext } from "../App";
import FileIcon from "./FileIcon";
import { BiRename } from "react-icons/bi";
import { VscTrash } from "react-icons/vsc";
import { useTranslation } from "react-i18next";

interface EntryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  path?: string;
  name?: string;
  level?: number;
  folderPath: string;
  onCreate?: () => any;
}

function File({ path, name, level = 0, folderPath, onCreate }: EntryProps) {
  const { t } = useTranslation();

  const [newName, setNewName] = useState<string | undefined>(name);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<any>();

  const { openedFiles, setOpenedFiles, currentFileIndex, setCurrentFileIndex } =
    useContext(FileContext) || {};

  useEffect(() => {
    if (!name) {
      setIsRenaming(true);
    }
  }, [name]);

  async function open(path: string) {
    setOpenedFiles!([
      ...openedFiles!,
      {
        path,
        name: await basename(path),
        language: await extname(path),
        value: await readTextFile(path),
      },
    ]);
    setCurrentFileIndex!(openedFiles!.length);
  }

  return (
    <>
      <div
        className={`button h-7 gap-2 pr-2 shrink-0 ${
          path === openedFiles![currentFileIndex!]?.path && "active"
        }`}
        style={{
          paddingLeft: 6 + level * 16,
        }}
        title={path}
        onClick={async () => {
          const fileIndex = openedFiles!.findIndex(
            (file) => file.path === path!
          );
          if (fileIndex !== -1) {
            setCurrentFileIndex!(fileIndex);
          } else if (path) {
            open(path);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuPosition({ x: e.pageX, y: e.pageY });
        }}
      >
        <FileIcon name={newName} />
        {isRenaming ? (
          <input
            className="outline-none w-0 flex-grow"
            autoFocus
            value={newName}
            spellCheck={false}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                if (e.currentTarget.value) {
                  e.currentTarget.blur();
                } else {
                  alert("Nama tidak boleh kosong.");
                }
              }
            }}
            onBlur={async (e) => {
              if (path) {
                const newFilePath = await join(
                  folderPath,
                  newName || e.target.value
                );
                if (onCreate) {
                  if (e.target.value) {
                    await writeTextFile(newFilePath, "");
                    open(newFilePath);
                  }
                  onCreate();
                } else if (newName) {
                  if (newName !== name) {
                    if (!(await exists(newFilePath))) {
                      renameFile(path, newFilePath);
                      setOpenedFiles!(
                        openedFiles!.map((file) => {
                          if (file.path === path) {
                            return {
                              ...file,
                              path: newFilePath,
                              name: newName,
                            };
                          } else {
                            return file;
                          }
                        })
                      );
                      setIsRenaming(false);
                    } else {
                      alert("Terdapat file bernama sama.");
                      e.target.focus();
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <span
            className={`whitespace-nowrap overflow-ellipsis overflow-hidden flex-grow text-left ${
              level === 0 && "font-bold"
            }`}
          >
            {name}
          </span>
        )}
      </div>
      {menuPosition && (
        <div
          className="fixed bg-black inset-0 z-40 bg-opacity-30 flex justify-center items-center"
          onClick={() => setMenuPosition(null)}
        >
          <div
            className="flex-col fixed z-40 w-48 menu"
            style={
              menuPosition && {
                left: menuPosition.x,
                top: menuPosition.y,
              }
            }
          >
            <button onClick={() => setIsRenaming(true)}>
              <BiRename />
              {t("explorer.rename")}...
            </button>
            <button
              onClick={async () => {
                if (
                  path &&
                  (await confirm(t("explorer.deleteConfirm") || undefined))
                ) {
                  await removeFile(path);
                  setOpenedFiles!(
                    openedFiles!.filter((file) => file.path !== path)
                  );
                }
              }}
            >
              <VscTrash />
              {t("explorer.delete")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default File;
