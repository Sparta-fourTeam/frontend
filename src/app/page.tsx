import { redirect } from "next/navigation";

// 루트(/)로 들어오면 로그인 화면으로 보냄
export default function Home() {
  redirect("/auth");
}
