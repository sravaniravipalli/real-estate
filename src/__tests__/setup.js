/* eslint-env node */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Minimal canvas mock for libs (e.g. lottie-web) used during App render.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => {
    const noop = () => {};
    return {
      canvas: document.createElement('canvas'),
      fillStyle: null,
      strokeStyle: null,
      lineWidth: 0,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      clearRect: noop,
      fillRect: noop,
      strokeRect: noop,
      beginPath: noop,
      closePath: noop,
      moveTo: noop,
      lineTo: noop,
      bezierCurveTo: noop,
      quadraticCurveTo: noop,
      arc: noop,
      rect: noop,
      clip: noop,
      fill: noop,
      stroke: noop,
      translate: noop,
      rotate: noop,
      scale: noop,
      transform: noop,
      setTransform: noop,
      save: noop,
      restore: noop,
      drawImage: noop,
      fillText: noop,
      strokeText: noop,
      measureText: () => ({ width: 0 }),
      createImageData: () => ({}),
      getImageData: () => ({ data: [] }),
      putImageData: noop,
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
      createPattern: () => ({}),
    };
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.VITE_REACT_API_URL = 'http://localhost:5000';
process.env.VITE_REACT_APP_PUBLIC_MAILCHIMP_URL = 'http://example.com/subscribe';
