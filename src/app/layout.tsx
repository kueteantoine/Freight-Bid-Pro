import "./globals.css";
import { SessionContextProvider } from "@/contexts/supabase-session-context";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionContextProvider>
            {children}
          </SessionContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}