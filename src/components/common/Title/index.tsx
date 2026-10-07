import classnames from "classnames/bind";
import s from "./Title.module.scss";

const cx = classnames.bind(s);

interface TitleProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

// 제목 + 부제목 (부제목은 선택)
export default function Title({ title, subtitle, align = "center", className }: TitleProps) {
  return (
    <header className={cx("header", align, className)}>
      <h1 className={cx("title")}>{title}</h1>
      {subtitle && <p className={cx("subtitle")}>{subtitle}</p>}
    </header>
  );
}
