import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}