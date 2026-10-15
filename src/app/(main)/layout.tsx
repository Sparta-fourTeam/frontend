import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/layout/AuthGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
