import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WiseCat, type WiseCatState } from '../components/mascot/WiseCat';
import { AcademicAuthShell } from '../components/auth/AcademicAuthShell';
import { KnowledgeMark } from '../components/brand/KnowledgeMark';
import { AcademicCampusScene } from '../components/illustrations/AcademicCampusScene';
import { KnowledgeParticles } from '../components/illustrations/KnowledgeParticles';

describe('Academic Light V2, Mascot, Atmosphere & Accessibility Tests', () => {
  describe('KnowledgeMark Product Mark Component', () => {
    it('renders with role img and accessible label at different scales', () => {
      const { rerender } = render(<KnowledgeMark size="sm" />);
      const markSm = screen.getByRole('img', { name: /final-web knowledge mark/i });
      expect(markSm).toBeInTheDocument();
      expect(markSm).toHaveClass('w-6', 'h-6');

      rerender(<KnowledgeMark size="md" />);
      expect(screen.getByRole('img', { name: /final-web knowledge mark/i })).toHaveClass('w-8', 'h-8');

      rerender(<KnowledgeMark size="lg" />);
      expect(screen.getByRole('img', { name: /final-web knowledge mark/i })).toHaveClass('w-12', 'h-12');
    });
  });

  describe('AcademicCampusScene & KnowledgeParticles Decorative Contracts', () => {
    it('renders campus line art as decorative aria-hidden SVG', () => {
      render(<AcademicCampusScene />);
      const scene = screen.getByTestId('academic-campus-scene');
      expect(scene).toBeInTheDocument();
      expect(scene).toHaveAttribute('aria-hidden', 'true');
      expect(scene).toHaveAttribute('role', 'presentation');
    });

    it('renders knowledge particles as decorative aria-hidden container', () => {
      render(<KnowledgeParticles />);
      const particles = screen.getByTestId('knowledge-particles');
      expect(particles).toBeInTheDocument();
      expect(particles).toHaveAttribute('aria-hidden', 'true');
      expect(particles).toHaveAttribute('role', 'presentation');
    });
  });

  describe('WiseCat V2 Mascot Component', () => {
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

    it('supports hero desktop companion scale without layout failure', () => {
      render(<WiseCat state="welcome" size="hero" />);
      const heroMascot = screen.getByTestId('wise-cat-welcome');
      expect(heroMascot).toBeInTheDocument();
      expect(heroMascot).toHaveClass('w-56', 'h-56');
    });
  });

  describe('AcademicAuthShell V2 Composition', () => {
    it('renders academic brand identity, editorial serif hero, campus scene, and form card', () => {
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

      // Verify editorial hero statement
      expect(screen.getByRole('heading', { level: 2, name: /where ideas become/i })).toBeInTheDocument();

      // Verify mascot presence
      expect(screen.getAllByTestId('wise-cat-welcome').length).toBeGreaterThan(0);

      // Verify form elements are accessible and not blocked
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /test input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit test/i })).toBeInTheDocument();

      // Verify footer presence
      expect(screen.getByText(/test footer/i)).toBeInTheDocument();

      // Verify decorative campus line art exists
      expect(screen.getByTestId('academic-campus-scene')).toBeInTheDocument();
    });
  });
});
