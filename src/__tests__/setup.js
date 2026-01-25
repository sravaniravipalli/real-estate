import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.VITE_REACT_API_URL = 'http://localhost:5000';
process.env.VITE_REACT_APP_PUBLIC_MAILCHIMP_URL = 'http://example.com/subscribe';
