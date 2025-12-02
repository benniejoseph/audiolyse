import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CallTranscribe',
  description: 'Transcribe, summarize, and extract MOM from call recordings',
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


