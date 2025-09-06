import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/nav";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getUserOptional } from "@/lib/auth";
import { getUnreadMessageCount } from "@/lib/server/inbox";

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

  // Get unread message count for the user
  const unreadCount = user ? await getUnreadMessageCount(user.id) : 0;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={false}>
            <AppSidebar user={user} unreadCount={unreadCount} />
            <SidebarInset>
              <Navigation user={user} unreadCount={unreadCount} />
              <div className="flex-1 flex flex-col min-h-0">{children}</div>
            </SidebarInset>
          </SidebarProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
