import '../styles/auth.css';
import '../globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: 'Audiolyse - Sign In',
  description: 'Sign in to Audiolyse - Precision Intelligence for Every Conversation',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
