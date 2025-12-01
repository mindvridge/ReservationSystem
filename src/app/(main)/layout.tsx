import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Force dynamic rendering for all pages under this layout
// because they use Clerk authentication
export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
