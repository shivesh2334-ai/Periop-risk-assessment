import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Perioperative Cardiac Risk Assessment',
  description: 'AI-powered preoperative risk assessment tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}