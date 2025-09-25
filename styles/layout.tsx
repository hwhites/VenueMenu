export const styles = {
  header: {
    backgroundColor: '#111827',
    color: '#f9fafb',
    padding: '1rem 2rem',
    borderBottom: '1px solid #374151',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: '#f9fafb',
  },
  navDesktop: {
    display: 'none', // Hidden on mobile
    alignItems: 'center',
    gap: '1.5rem',
    // Media query would go here in a real CSS file
    // In JS, we handle responsiveness in the component or with a library
    // For now, we rely on the hamburger menu for mobile
  },
  navLink: {
    textDecoration: 'none',
    color: '#d1d5db',
    fontSize: '1rem',
  },
  navLinkPrimary: {
    textDecoration: 'none',
    color: '#f9fafb',
    backgroundColor: '#1d4ed8',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    // In JS, we can't use media queries easily, so we show it always
    // and hide the desktop nav
  },
  hamburgerLine: {
    width: '25px',
    height: '3px',
    backgroundColor: '#f9fafb',
    borderRadius: '3px',
  },
  mobileMenu: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '80%',
    height: '100%',
    backgroundColor: '#1f2937',
    zIndex: 100,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '2rem',
    background: 'none',
    border: 'none',
    color: '#f9fafb',
    fontSize: '2.5rem',
    cursor: 'pointer',
  },
  navMobile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    marginTop: '4rem',
  },
  navLinkMobile: {
    textDecoration: 'none',
    color: '#d1d5db',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
};

// Simple way to add responsiveness for desktop
if (typeof window !== 'undefined' && window.innerWidth >= 768) {
  styles.navDesktop.display = 'flex';
  styles.hamburger.display = 'none';
}
