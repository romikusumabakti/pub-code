import { ButtonHTMLAttributes } from "react";

type Variant = "filled" | "tonal";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  className?: string;
}

function Button({ variant = "filled", className, ...props }: ButtonProps) {
  const styles: Record<Variant, string> = {
    filled: "interactive-bg-primary",
    tonal: "interactive-bg-secondary-container",
  };

  return (
    <button
      className={`h-10 px-5 justify-center font-bold w-32 rounded-full ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export default Button;
