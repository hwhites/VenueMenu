export const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#111827', // Dark background
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  formWrapper: {
    padding: '40px',
    backgroundColor: '#1f2937', // Darker form background
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    width: '100%',
    maxWidth: '600px', // Increased max-width for more space
  },
  header: {
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#f9fafb', // Light text
  },
  subHeader: {
    fontSize: '14px',
    color: '#9ca3af', // Lighter gray text
    textAlign: 'center',
    marginBottom: '24px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#d1d5db', // Light gray label
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #4b5563', // Gray border
    fontSize: '16px',
    backgroundColor: '#374151', // Darker input background
    color: '#f9fafb', // Light text color
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #4b5563',
    fontSize: '16px',
    backgroundColor: '#374151',
    color: '#f9fafb',
    minHeight: '120px', // Taller text area
    resize: 'vertical', // Allow vertical resize
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #4b5563',
    fontSize: '16px',
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3b82f6', // Blue button
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  message: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '14px',
  },
  link: {
    display: 'block',
    marginTop: '20px',
    textAlign: 'center',
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '14px',
  },
};
