import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, VT323, Cinzel, Lora } from 'next/font/google';
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

const cinzelFont = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
});

const loraFont = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
});

export const metadata: Metadata = {
  title: 'Step Cook',
  description: 'Recettes pas à pas pour Thermomix',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Step Cook',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon.svg',
    // iOS n'affiche pas les SVG en icône d'écran d'accueil : il faut un PNG.
    apple: '/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelFont.variable} ${cinzelFont.variable} ${loraFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
