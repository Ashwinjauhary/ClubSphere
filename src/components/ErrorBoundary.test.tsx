import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { describe, it, expect, vi } from 'vitest';

const ThrowError = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error fallback when a child throws', () => {
    // Suppress console.error in tests to avoid noisy output when error is expected
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    
    consoleError.mockRestore();
  });
});
