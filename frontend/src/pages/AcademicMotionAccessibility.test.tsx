import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WiseCat, type WiseCatState } from '../components/mascot/WiseCat';
import { AcademicAuthShell } from '../components/auth/AcademicAuthShell';

describe('Academic Light, Mascot & Accessibility Tests', () => {
  describe('WiseCat Mascot Component', () => {
    const states: WiseCatState[] = ['welcome', 'reading', 'loading', 'success', 'verification', 'settings'];

    states.forEach((state) => {
      it(`renders correctly in "${state}" state with accessible aria-label`, () => {
        render(<WiseCat state={state} size="md" />);

        const mascotEl = screen.getByTestId(`wise-cat-${state}`);
        expect(mascotEl).toBeInTheDocument();
        expect(mascotEl).toHaveAttribute('role', 'img');
        expect(mascotEl).toHaveAttribute('aria-label');
      });
    });

    it('supports different sizes without breaking layout', () => {
      const { rerender } = render(<WiseCat state="welcome" size="sm" />);
      expect(screen.getByTestId('wise-cat-welcome')).toHaveClass('w-9', 'h-9');

      rerender(<WiseCat state="welcome" size="lg" />);
      expect(screen.getByTestId('wise-cat-welcome')).toHaveClass('w-28', 'h-28');
    });
  });

  describe('AcademicAuthShell Composition', () => {
    it('renders academic brand identity, mascot, and form card', () => {
      render(
        <MemoryRouter>
          <AcademicAuthShell
            title="Student Test Portal"
            subtitle="Academic Light Testing"
            mascotState="welcome"
            footer={<span>Test Footer</span>}
          >
            <form data-testid="test-form">
              <input type="text" aria-label="Test Input" defaultValue="value" />
              <button type="submit">Submit Test</button>
            </form>
          </AcademicAuthShell>
        </MemoryRouter>
      );

      // Verify headings and identity
      expect(screen.getByRole('heading', { level: 1, name: /student test portal/i })).toBeInTheDocument();
      expect(screen.getByText(/academic light testing/i)).toBeInTheDocument();
      expect(screen.getAllByText(/living knowledge/i).length).toBeGreaterThan(0);

      // Verify mascot presence
      expect(screen.getAllByTestId('wise-cat-welcome').length).toBeGreaterThan(0);

      // Verify form elements are accessible and not blocked
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /test input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit test/i })).toBeInTheDocument();

      // Verify footer presence
      expect(screen.getByText(/test footer/i)).toBeInTheDocument();
    });
  });
});
