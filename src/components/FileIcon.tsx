import { VscFile, VscFileBinary, VscFileCode } from "react-icons/vsc";
import PUBCodeIcon from "./PUBCodeIcon";

function FileIcon({ name }: { name?: string }) {
  return (
    <span className="text-primary">
      {name?.endsWith(".c") ? (
        <VscFileCode />
      ) : name?.endsWith(".exe") ? (
        <VscFileBinary />
      ) : name === "pub-code.json" ? (
        <PUBCodeIcon className="fill-primary w-4" />
      ) : (
        <VscFile />
      )}
    </span>
  );
}

export default FileIcon;
