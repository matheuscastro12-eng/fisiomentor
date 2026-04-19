import { Sidebar } from "@/components/shared/sidebar";
import { TopBar } from "@/components/shared/top-bar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile bottom nav - hidden on desktop */}
      <MobileNav />

      <div className="lg:ml-[220px]">
        <TopBar />
        <main className="p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
