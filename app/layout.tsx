import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Scott & Sue\'s Shared Calendar',
  description: 'Shared calendar app built with Next.js, Tailwind CSS, and TypeScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
