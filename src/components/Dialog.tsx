import { HTMLAttributes } from "react";

interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

function Dialog({ isOpen, onClose, className, ...rest }: DialogProps) {
  return isOpen ? (
    <div
      className="absolute bg-black inset-0 z-40 bg-opacity-30 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className={`bg-surface1 p-8 rounded-3xl ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      />
    </div>
  ) : null;
}

export default Dialog;
