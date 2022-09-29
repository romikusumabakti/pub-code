import { ButtonHTMLAttributes } from "react";

interface VariantStyle {
  button: string;
  stateLayer: string;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "tonal";
  className?: string;
}

function Button({ variant = "filled", className, ...rest }: ButtonProps) {
  const variants: Record<string, VariantStyle> = {
    filled: {
      button: "bg-primary text-on-primary",
      stateLayer: "bg-on-primary",
    },
    tonal: {
      button: "bg-secondary-container text-on-secondary-container",
      stateLayer: "bg-on-secondary-container",
    },
  };

  return (
    <span
      className={`self-center font-bold mt-auto w-32 rounded-full flex ${variants[variant].button} ${className}`}
    >
      <button
        className={`h-10 px-5 justify-center flex-grow hover:bg-opacity-hover rounded-full`}
        {...rest}
      />
    </span>
  );
}

export default Button;
