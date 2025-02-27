import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "./SessionProviderWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Header } from "@/components/ui/header";
import Image from "next/image";
import { Footer } from "@/components/ui/footer";
import { Toaster } from "@/components/ui/sonner";
import QueryClientContextProvider from "@/app/providers/ReactQueryProviders";
import { FcmTokenProvider } from "@/hooks/useFcmToken";
import { ThemeProvider } from "@/app/providers/themeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Queen App",
  description: "Our app for our story",
  applicationName: "My Queen App",
  icons: "/favicon.ico",
};

const icon = (
  <Image
    src="/favicon.ico"
    alt="Create Next App"
    width="32"
    height="32"
    className="rounded-full"
  />
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
          <ProtectedRoute>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <QueryClientContextProvider>
                <FcmTokenProvider>
                  <Header
                    className="bg-primary text-primary-foreground"
                    size="lg"
                    icon={icon}
                  />
                  {children}
                  <Footer
                    className="bg-primary text-primary-foreground"
                    size="lg"
                  />
                  <Toaster />
                </FcmTokenProvider>
              </QueryClientContextProvider>
            </ThemeProvider>
          </ProtectedRoute>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
