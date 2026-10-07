import classnames from "classnames/bind";
import s from "./MainLayout.module.scss";
import Sidebar from "../Sidebar";

const cx = classnames.bind(s);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cx("wrapper")}>
      <Sidebar />
      <main className={cx("content")}>{children}</main>
    </div>
  );
}
