import classnames from "classnames/bind";
import s from "./Button.module.scss";

const cx = classnames.bind(s);

type ButtonVariant = "primary" | "outline" | "danger";
type ButtonSize = "medium" | "small";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  size = "medium",
  fullWidth = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("button", variant, size, { fullWidth }, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
