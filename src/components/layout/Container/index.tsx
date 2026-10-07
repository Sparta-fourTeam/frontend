import classnames from "classnames/bind";
import s from "./Container.module.scss";

const cx = classnames.bind(s);

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// 화면 전체를 채우고 내용을 가운데 정렬하는 페이지 레이아웃
export default function Container({ children, className }: ContainerProps) {
  return <main className={cx("container", className)}>{children}</main>;
}
