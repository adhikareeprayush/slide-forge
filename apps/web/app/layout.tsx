import { Instrument_Serif, DM_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'SlideForge — AI Presentations',
  description: 'Open-source AI-powered presentation generator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        {children}
      </body>
    </html>
  );
}
