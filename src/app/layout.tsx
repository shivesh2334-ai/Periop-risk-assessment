// Layout file for the application
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <title>Periop Risk Assessment</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
