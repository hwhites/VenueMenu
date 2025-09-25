// app/layout.tsx

import './globals.css'; // Assuming you have a global CSS file
import Header from '../components/Header'; // Assuming you have a Header component

// FIX: Define Metadata outside the component body (standard practice)
export const metadata = {
  title: 'VenueMenu',
  description: 'The Musician\'s Marketplace',
};

// FIX: Explicitly type the component props using React.PropsWithChildren
export default function RootLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}

// NOTE: You will need to ensure 'React' is imported in this file if it's not already.
// If your Next.js setup uses default imports, ensure you add:
// import React from 'react';
// If it is a new Next.js 13+ project, it often uses the built-in React polyfills
// and modern import syntax, but explicit typing often requires the import.