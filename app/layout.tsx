import type { Metadata } from 'next';
import { Geist, Geist_Mono, VT323 } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const pixelFont = VT323({
  weight: '400',
  variable: '--font-pixel',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Step cook',
  description: 'Display recipes in a step by step manner',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
