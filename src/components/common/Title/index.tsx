import classnames from "classnames/bind";
import s from "./Title.module.scss";

const cx = classnames.bind(s);

interface TitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

// 제목 + 부제목 (부제목은 선택)
export default function Title({ title, subtitle, className }: TitleProps) {
  return (
    <header className={cx("header", className)}>
      <h1 className={cx("title")}>{title}</h1>
      {subtitle && <p className={cx("subtitle")}>{subtitle}</p>}
    </header>
  );
}
