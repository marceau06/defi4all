import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from './providers';
import '@rainbow-me/rainbowkit/styles.css';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          <Header />
            {children}
          <Footer />
      </Providers>
      </body>
    </html>
  );
}
