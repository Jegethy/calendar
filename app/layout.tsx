import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shared Calendar',
  description: 'A shared calendar for two users',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  );
}
