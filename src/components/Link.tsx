import { shell } from "@tauri-apps/api";
import { AnchorHTMLAttributes } from "react";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
  children?: any;
}

function Link({ to, children }: LinkProps) {
  return <a onClick={() => shell.open(to || children)}>{children}</a>;
}

export default Link;
