import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from './providers';
import { Toaster } from "@/components/ui/sonner";
import '@rainbow-me/rainbowkit/styles.css';

export default function RootLayout({ children }) {
  return (
    <html className="dark" lang="en" suppressHydrationWarning>
      <body>
        <Providers>
            <Header />
              {children}
            <Footer />
            <Toaster />
      </Providers>
      </body>
    </html>
  );
}
