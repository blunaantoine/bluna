import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cursor />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
