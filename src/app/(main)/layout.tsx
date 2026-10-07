import MainLayout from "@/components/layout/MainLayout";

// (main) 그룹 안의 모든 화면에 사이드바 레이아웃 적용 (URL 에는 (main) 안 붙음)
export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
