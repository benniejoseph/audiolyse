import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Audiolyse - Call Analysis & Marketing Strategy',
  description: 'AI-powered call analysis platform. Get transcription, coaching scores, conversion predictions, and strategic marketing insights from your customer calls.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


