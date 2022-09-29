import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MdSchool } from "react-icons/md";
import { Trans, useTranslation } from "react-i18next";
import Dialog from "./Dialog";
import { VscClose } from "react-icons/vsc";
import Link from "./Link";
import { getVersion } from "@tauri-apps/api/app";

export function AboutHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <h1 className="display text-3xl flex gap-3">
        <MdSchool className="text-primary" />
        <span>
          <strong>PUB</strong> Code
        </span>
      </h1>
      <h2>{t("description")}</h2>
    </div>
  );
}

export function AboutFooter() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <div>
        <Trans
          i18nKey="about.partOfPubPortal"
          values={{ pubPortal: t("pubPortal") }}
        >
          <Link className="display" to="https://portal.pubpasim.org/" />
        </Trans>
      </div>
      <div>
        © 2022 <strong className="display">{t("pubEduDiv")}</strong>
      </div>
    </div>
  );
}

interface AboutProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

function About({ isOpen, setIsOpen }: AboutProps) {
  const { t } = useTranslation();
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then((version) => setVersion(version));
  }, []);

  return (
    <Dialog
      className="flex flex-col gap-6 relative w-[384px]"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <AboutHeader />
      <div className="flex flex-col gap-1">
        <div>
          {t("about.version")}: {version}
        </div>
        <div>{t("about.creator")}: Romi Kusuma Bakti</div>
        <div>{t("about.license")}: MIT</div>
        <div>
          GitHub: <Link>https://github.com/romikusumabakti/pub-code</Link>
        </div>
      </div>
      <AboutFooter />
      <button
        className="w-10 h-10 rounded-full text-2xl ml-auto flex items-center justify-center absolute top-6 right-6"
        onClick={() => setIsOpen(false)}
      >
        <VscClose />
      </button>
    </Dialog>
  );
}

export default About;
