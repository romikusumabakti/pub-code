import { InputHTMLAttributes } from "react";

interface RadioButtonProps extends InputHTMLAttributes<HTMLInputElement> {
  children: any;
  disabled?: boolean;
}

function RadioButton({ children, disabled = false, ...rest }: RadioButtonProps) {
  return (
    <label className={`flex-1 flex gap-2 ${disabled && "text-on-disabled"}`}>
      <input type="radio" disabled={disabled} {...rest} />
      {children}
    </label>
  );
}

export default RadioButton;
