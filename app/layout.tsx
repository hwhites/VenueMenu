import Header from '../components/Header';
import './globals.css'; // We will create this next

export const metadata = {
  title: 'VenueMenu',
  description: 'Connecting artists and venues.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
