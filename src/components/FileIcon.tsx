import { MdSchool } from "react-icons/md";
import { VscFile, VscFileBinary, VscFileCode } from "react-icons/vsc";

function FileIcon({ name }: { name?: string }) {
  return (
    <span className="text-primary">
      {name?.endsWith(".c") ? (
        <VscFileCode />
      ) : name?.endsWith(".exe") ? (
        <VscFileBinary />
      ) : name === "pub-code.json" ? (
        <MdSchool />
      ) : (
        <VscFile />
      )}
    </span>
  );
}

export default FileIcon;
