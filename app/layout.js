import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinTrack",
  description: "Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          {/* Header */}
          <Header />

          <main className="min-h-screen px-4 max-w-6xl mx-auto">
            {children}
          </main>

          <Toaster richColors />

          {/* Footer */}
          <footer className="bg-blue-50 py-12">
            <div className="container max-w-6xl mx-auto px-4 text-center text-gray-600">
              <p>Made with passion</p>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
