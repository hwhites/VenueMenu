'use client';

// Note: No imports for user state needed here anymore, header handles it.
// We keep the container style for the page content.
import { styles } from '../styles/forms';
import * as React from 'react'; // FIX: Import React for CSSProperties casting

export default function HomePage() {
  // FIX: Apply casting to all external style objects to bypass build errors
  return (
    // We use the container and formWrapper for consistent content styling
    <div
      style={
        {
          ...(styles.container as React.CSSProperties),
          minHeight: 'calc(100vh - 80px)',
          alignItems: 'flex-start',
        } as React.CSSProperties
      }
    >
      <div
        style={
          {
            ...(styles.formWrapper as React.CSSProperties),
            maxWidth: '800px',
            textAlign: 'center',
            marginTop: '2rem',
          } as React.CSSProperties
        }
      >
        {/* FIX: Cast style property */}
        <h1 style={styles.header as any}>The Musician&apos;s Marketplace</h1>
        <p style={styles.subHeader as any}>Where artists and venues connect.</p>

        <div
          style={{
            marginTop: '40px',
            color: '#9ca3af',
            borderTop: '1px solid #4b5563',
            paddingTop: '20px',
          }}
        >
          {/* FIX: Cast style property */}
          <h2 style={{ ...(styles.header as any), fontSize: '20px' }}>
            Featured Artists
          </h2>
          <p>(This is where articles, ads, or boosted posts will go)</p>
        </div>
      </div>
    </div>
  );
}