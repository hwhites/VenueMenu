export const styles = {
  header: {
    backgroundColor: '#111827',
    padding: '1rem',
    color: '#f9fafb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    color: '#f9fafb',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  hamburgerButton: {
    background: '#1f2937',
    border: '1px solid #4b5563',
    borderRadius: '4px',
    color: '#f9fafb',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
  },
  mobileMenu: {
    backgroundColor: '#1f2937',
    position: 'absolute',
    top: '59px',
    right: 0,
    width: '100%',
    maxWidth: '280px',
    padding: '1rem 0',
    zIndex: 40,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  // ADDITION: The missing style for mobile menu items
  mobileMenuItem: {
    display: 'block',
    padding: '0.75rem 1.5rem',
    color: '#d1d5db',
    textDecoration: 'none',
    borderBottom: '1px solid #374151',
  },
  notificationButton: {
    background: 'none',
    border: 'none',
    color: '#f9fafb',
    fontSize: '1.5rem',
    cursor: 'pointer',
    position: 'relative',
    padding: '0.5rem'
  },
  notificationCount: {
    position: 'absolute',
    bottom: '5px',
    right: '0px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    border: '2px solid #111827'
  },
  notificationDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    width: '300px',
    maxHeight: '400px',
    overflowY: 'auto',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    zIndex: 110,
    border: '1px solid #374151'
  },
  notificationItem: {
    display: 'block',
    padding: '1rem',
    borderBottom: '1px solid #374151',
    textDecoration: 'none',
    color: '#f9fafb'
  }
};

