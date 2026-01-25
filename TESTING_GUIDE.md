# Testing Guide for Real Estate AI

## Overview
This project uses **Vitest** for unit and integration testing with **React Testing Library** for component tests.

## Setup

### Install Dependencies
```bash
npm install
```

The following testing dependencies are included:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for Node.js
- `@vitest/ui` - Visual test UI

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Watch mode (auto-rerun on file changes)
```bash
npm test -- --watch
```

## Test Structure

```
src/
  __tests__/
    setup.js          # Test environment setup
    App.test.jsx      # App component tests
    apiUtils.test.js  # API utility tests
    propertyFilters.test.js  # Filter logic tests
```

## Writing Tests

### Example: Component Test
```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders heading', () => {
    render(<MyComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
```

### Example: Utility Function Test
```javascript
import { describe, it, expect } from 'vitest';
import { myUtilityFunction } from '../utils/myUtils';

describe('myUtilityFunction', () => {
  it('returns expected value', () => {
    const result = myUtilityFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

## Test Configuration

Configuration is defined in `vitest.config.js`:
- **Environment**: jsdom (simulates browser)
- **Globals**: Vitest globals enabled
- **Setup**: Runs `src/__tests__/setup.js` before tests
- **Coverage**: V8 provider with HTML/JSON/text reports

## Mocking

### Mock API Calls
```javascript
import { vi } from 'vitest';

vi.mock('../api/ai', () => ({
  generatePropertyInfo: vi.fn().mockResolvedValue({ data: 'mock' })
}));
```

### Mock Firebase
```javascript
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: {} })
}));
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see/do
2. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Avoid testing internal state** - Test props and rendered output
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive test names** - Clear "should" statements

## Coverage Goals

- **Utilities**: 80%+ coverage
- **API functions**: 70%+ coverage
- **Components**: 60%+ coverage (focus on critical paths)

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm test -- --run

- name: Generate coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests timing out
Increase timeout in test:
```javascript
it('long test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Module not found errors
Check `jsconfig.json` paths match `vitest.config.js` aliases.

### Firebase errors in tests
Ensure Firebase is mocked in `setup.js` or individual test files.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
