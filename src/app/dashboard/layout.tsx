import { SideNav } from "./side-nav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="container mx-auto pt-12 min-h-screen">
      <div className="flex flex-col sm:flex-row gap-8">
        <SideNav />

        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}