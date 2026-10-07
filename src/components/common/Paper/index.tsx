import classnames from "classnames/bind";
import s from "./Paper.module.scss";

const cx = classnames.bind(s);

interface PaperProps {
  children: React.ReactNode;
  className?: string;
}

// 흰 배경 + 둥근 모서리 + 그림자 카드
export default function Paper({ children, className }: PaperProps) {
  return <section className={cx("paper", className)}>{children}</section>;
}
