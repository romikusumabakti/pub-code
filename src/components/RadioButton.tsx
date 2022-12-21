import { InputHTMLAttributes } from "react";

interface RadioButtonProps extends InputHTMLAttributes<HTMLInputElement> {
  children: any;
  disabled?: boolean;
}

function RadioButton({
  children,
  disabled = false,
  ...rest
}: RadioButtonProps) {
  return (
    <span className={`flex-1 flex ${disabled && "text-on-disabled"}`}>
      <label className="flex gap-2">
        <input type="radio" disabled={disabled} {...rest} />
        {children}
      </label>
    </span>
  );
}

export default RadioButton;
