import classnames from "classnames/bind";
import s from "./Button.module.scss";

const cx = classnames.bind(s);

// 색 종류 (필요하면 여기랑 scss에 추가)
type ButtonVariant = "primary" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("button", variant, { fullWidth }, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
