import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { ButtonHTMLAttributes, useEffect, useState } from "react";
import { VscChevronDown, VscChevronRight, VscNewFile } from "react-icons/vsc";
import File from "./File";

interface EntryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  path?: string;
  name?: string;
  level?: number;
  autoFetchChildren?: boolean;
}

function Folder({
  path,
  name,
  level = 0,
  autoFetchChildren = false,
}: EntryProps) {
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isNewFile, setIsNewFile] = useState<boolean>(false);

  async function fetchChildren() {
    if (path) {
      const entries = await readDir(path);
      setChildren(entries);
      setIsOpen(true);
    }
  }

  useEffect(() => {
    if (autoFetchChildren) {
      fetchChildren();
    }
  }, []);

  return (
    <>
      <div
        className="button h-7 gap-2 pr-2 shrink-0"
        style={{
          paddingLeft: 6 + level * 16,
        }}
        title={path}
        onClick={async () => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            await fetchChildren();
          }
        }}
      >
        <span>{isOpen ? <VscChevronDown /> : <VscChevronRight />}</span>
        <span
          className={`whitespace-nowrap overflow-ellipsis overflow-hidden flex-grow text-left ${
            level === 0 && "font-bold"
          }`}
        >
          {name}
        </span>
        <button
          className="w-7 h-7 flex justify-center text-primary shrink-0"
          onClick={async (e) => {
            e.stopPropagation();
            await fetchChildren();
            setIsNewFile(true);
          }}
        >
          <VscNewFile />
        </button>
      </div>
      {isOpen && [
        children!
          .filter((child) => child.children)
          .map((child) => (
            <Folder
              key={child.path}
              path={child.path}
              name={child.name}
              level={level + 1}
            />
          )),
        isNewFile && (
          <File
            path={path}
            level={level + 1}
            siblings={children}
            setSiblings={setChildren}
            onCreate={() => {
              fetchChildren();
              setIsNewFile(false);
            }}
          />
        ),
        children!
          .filter((child) => !child.children)
          .map((child) => (
            <File
              key={child.path}
              path={child.path}
              name={child.name}
              level={level + 1}
              siblings={children}
              setSiblings={setChildren}
            />
          )),
      ]}
    </>
  );
}

export default Folder;
