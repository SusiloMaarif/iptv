import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamVault - IPTV + World Cup',
  description: 'Watch live TV channels + FIFA World Cup 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scrollbar-hide">{children}</body>
    </html>
  );
}