import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/nav";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";

import { getUserOptional } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Car Scene NZ",
  description: "A social platform for car enthusiasts in New Zealand",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user on server side following Next.js 15 DAL pattern
  const user = await getUserOptional();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar user={user} />
              <SidebarInset>
                <Navigation user={user} />
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="min-h-screen bg-background">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <div className="max-w-7xl mx-auto">{children}</div>
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ReactQueryProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
