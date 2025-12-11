import type { Metadata } from 'next';
import './globals.css';
import './styles/landing.css';
import './styles/legal.css';
import './styles/themes.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieConsent } from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'Audiolyse - Precision Intelligence for Every Conversation',
  description: 'AI-powered call analysis platform. Get transcription, coaching scores, conversion predictions, and strategic marketing insights from your customer calls.',
  icons: {
    icon: '/audiolyseLogo.png',
    apple: '/audiolyseLogo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Monoton&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/audiolyseLogo.png" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
