'use client';

// Note: No imports for user state needed here anymore, header handles it.
// We keep the container style for the page content.
import { styles } from '../styles/forms';

export default function HomePage() {
  return (
    // We use the container and formWrapper for consistent content styling
    <div
      style={{
        ...styles.container,
        minHeight: 'calc(100vh - 80px)',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          ...styles.formWrapper,
          maxWidth: '800px',
          textAlign: 'center',
          marginTop: '2rem',
        }}
      >
        <h1 style={styles.header}>The Musician's Marketplace</h1>
        <p style={styles.subHeader}>Where artists and venues connect.</p>

        <div
          style={{
            marginTop: '40px',
            color: '#9ca3af',
            borderTop: '1px solid #4b5563',
            paddingTop: '20px',
          }}
        >
          <h2 style={{ ...styles.header, fontSize: '20px' }}>
            Featured Artists
          </h2>
          <p>(This is where articles, ads, or boosted posts will go)</p>
        </div>
      </div>
    </div>
  );
}
