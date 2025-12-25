/**
 * EncryptionStatus Component Tests
 * Tests for displaying ballot encryption status
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EncryptionStatus } from '../encryption-status';

describe('EncryptionStatus', () => {
  describe('status rendering', () => {
    describe('pending status', () => {
      it('should render pending status title', () => {
        render(<EncryptionStatus status="pending" />);

        expect(screen.getByText('Encryption Pending')).toBeInTheDocument();
      });

      it('should render pending status description', () => {
        render(<EncryptionStatus status="pending" />);

        expect(screen.getByText(/Complete the key ceremony to enable vote encryption/i)).toBeInTheDocument();
      });

      it('should have amber color scheme for pending', () => {
        const { container } = render(<EncryptionStatus status="pending" />);

        const mainDiv = container.querySelector('.bg-amber-50');
        expect(mainDiv).toBeInTheDocument();
      });

      it('should display lock icon for pending', () => {
        const { container } = render(<EncryptionStatus status="pending" />);

        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    describe('ready status', () => {
      it('should render ready status title', () => {
        render(<EncryptionStatus status="ready" />);

        expect(screen.getByText('Encryption Ready')).toBeInTheDocument();
      });

      it('should render ready status description', () => {
        render(<EncryptionStatus status="ready" />);

        expect(screen.getByText(/Threshold key ceremony complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Votes will be encrypted/i)).toBeInTheDocument();
      });

      it('should have green color scheme for ready', () => {
        const { container } = render(<EncryptionStatus status="ready" />);

        const mainDiv = container.querySelector('.bg-green-50');
        expect(mainDiv).toBeInTheDocument();
      });

      it('should display lock icon for ready', () => {
        const { container } = render(<EncryptionStatus status="ready" />);

        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    describe('active status', () => {
      it('should render active status title', () => {
        render(<EncryptionStatus status="active" />);

        expect(screen.getByText('Encryption Active')).toBeInTheDocument();
      });

      it('should render active status description', () => {
        render(<EncryptionStatus status="active" />);

        expect(screen.getByText(/Voters are submitting encrypted ballots/i)).toBeInTheDocument();
      });

      it('should have blue color scheme for active', () => {
        const { container } = render(<EncryptionStatus status="active" />);

        const mainDiv = container.querySelector('.bg-blue-50');
        expect(mainDiv).toBeInTheDocument();
      });

      it('should display lock icon for active', () => {
        const { container } = render(<EncryptionStatus status="active" />);

        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('public key display', () => {
    const shortKey = 'pk-abc123def456';
    const mediumKey = 'pk-' + 'a'.repeat(100);
    const longKey = 'pk-' + 'a'.repeat(500);

    it('should not display public key section when not provided', () => {
      render(<EncryptionStatus status="pending" />);

      expect(screen.queryByText(/Public Key/i)).not.toBeInTheDocument();
    });

    it('should display public key section when provided', () => {
      render(<EncryptionStatus status="ready" publicKey={shortKey} />);

      expect(screen.getByText(/Public Key \(truncated\):/i)).toBeInTheDocument();
    });

    it('should display short public key', () => {
      render(<EncryptionStatus status="ready" publicKey={shortKey} />);

      expect(screen.getByText(/pk-abc123def456/i)).toBeInTheDocument();
    });

    it('should truncate public key to 64 characters', () => {
      render(<EncryptionStatus status="ready" publicKey={longKey} />);

      const keyElement = screen.getByText(/pk-aaaa/);
      expect(keyElement.textContent).toMatch(/^pk-a{61}\.\.\.$/);
    });

    it('should display ellipsis after truncated key', () => {
      render(<EncryptionStatus status="ready" publicKey={mediumKey} />);

      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });

    it('should render key in code element', () => {
      const { container } = render(<EncryptionStatus status="ready" publicKey={shortKey} />);

      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveTextContent(/pk-abc123def456/);
    });

    it('should have proper styling for code element', () => {
      const { container } = render(<EncryptionStatus status="ready" publicKey={shortKey} />);

      const codeElement = container.querySelector('code');
      expect(codeElement).toHaveClass('break-all');
    });

    it('should display public key label', () => {
      render(<EncryptionStatus status="ready" publicKey={shortKey} />);

      expect(screen.getByText('Public Key (truncated):')).toBeInTheDocument();
    });
  });

  describe('status transitions', () => {
    it('should render correctly when status changes from pending to ready', () => {
      const { rerender } = render(<EncryptionStatus status="pending" />);

      expect(screen.getByText('Encryption Pending')).toBeInTheDocument();

      rerender(<EncryptionStatus status="ready" />);

      expect(screen.getByText('Encryption Ready')).toBeInTheDocument();
      expect(screen.queryByText('Encryption Pending')).not.toBeInTheDocument();
    });

    it('should render correctly when status changes from ready to active', () => {
      const { rerender } = render(<EncryptionStatus status="ready" />);

      expect(screen.getByText('Encryption Ready')).toBeInTheDocument();

      rerender(<EncryptionStatus status="active" />);

      expect(screen.getByText('Encryption Active')).toBeInTheDocument();
      expect(screen.queryByText('Encryption Ready')).not.toBeInTheDocument();
    });

    it('should handle public key being added after initial render', () => {
      const { rerender } = render(<EncryptionStatus status="pending" />);

      expect(screen.queryByText(/Public Key/i)).not.toBeInTheDocument();

      rerender(<EncryptionStatus status="ready" publicKey="pk-new-key-123" />);

      expect(screen.getByText(/Public Key \(truncated\):/i)).toBeInTheDocument();
      expect(screen.getByText(/pk-new-key-123/i)).toBeInTheDocument();
    });

    it('should handle public key being removed', () => {
      const { rerender } = render(<EncryptionStatus status="ready" publicKey="pk-123" />);

      expect(screen.getByText(/Public Key/i)).toBeInTheDocument();

      rerender(<EncryptionStatus status="ready" />);

      expect(screen.queryByText(/Public Key/i)).not.toBeInTheDocument();
    });
  });

  describe('layout and structure', () => {
    it('should render main container with proper classes', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const mainDiv = container.querySelector('.rounded-lg.border');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have flex layout for icon and content', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const flexContainer = container.querySelector('.flex.items-start.gap-3');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render icon before content', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const flexContainer = container.querySelector('.flex.items-start');
      const children = flexContainer?.children;
      expect(children?.[0]?.querySelector('svg')).toBeInTheDocument();
    });

    it('should have proper spacing classes', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      expect(container.querySelector('.p-4')).toBeInTheDocument();
      expect(container.querySelector('.gap-3')).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes for pending status', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      expect(container.querySelector('.dark\\:bg-amber-950')).toBeInTheDocument();
      expect(container.querySelector('.dark\\:border-amber-800')).toBeInTheDocument();
    });

    it('should have dark mode classes for ready status', () => {
      const { container } = render(<EncryptionStatus status="ready" />);

      expect(container.querySelector('.dark\\:bg-green-950')).toBeInTheDocument();
      expect(container.querySelector('.dark\\:border-green-800')).toBeInTheDocument();
    });

    it('should have dark mode classes for active status', () => {
      const { container } = render(<EncryptionStatus status="active" />);

      expect(container.querySelector('.dark\\:bg-blue-950')).toBeInTheDocument();
      expect(container.querySelector('.dark\\:border-blue-800')).toBeInTheDocument();
    });

    it('should have dark mode text classes', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      expect(container.querySelector('.dark\\:text-zinc-100')).toBeInTheDocument();
      expect(container.querySelector('.dark\\:text-zinc-400')).toBeInTheDocument();
    });

    it('should have dark mode classes for public key code block', () => {
      const { container } = render(<EncryptionStatus status="ready" publicKey="pk-123" />);

      expect(container.querySelector('code.dark\\:bg-zinc-800')).toBeInTheDocument();
      expect(container.querySelector('code.dark\\:text-zinc-300')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have semantic heading structure', () => {
      render(<EncryptionStatus status="pending" />);

      const heading = screen.getByText('Encryption Pending');
      expect(heading.tagName).toBe('H4');
    });

    it('should have descriptive text for each status', () => {
      render(<EncryptionStatus status="pending" />);

      const description = screen.getByText(/Complete the key ceremony/i);
      expect(description.tagName).toBe('P');
    });

    it('should render SVG with proper viewBox', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should use proper ARIA roles implicitly through semantic HTML', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      // Verify semantic HTML elements are used
      expect(container.querySelector('h4')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined public key gracefully', () => {
      render(<EncryptionStatus status="ready" publicKey={undefined} />);

      expect(screen.queryByText(/Public Key/i)).not.toBeInTheDocument();
    });

    it('should handle empty string public key', () => {
      render(<EncryptionStatus status="ready" publicKey="" />);

      // Empty string should be treated as no key (falsy)
      expect(screen.queryByText(/Public Key \(truncated\):/i)).not.toBeInTheDocument();
    });

    it('should handle very short public key', () => {
      render(<EncryptionStatus status="ready" publicKey="pk" />);

      expect(screen.getByText(/pk\.\.\./)).toBeInTheDocument();
    });

    it('should handle public key with special characters', () => {
      const specialKey = 'pk-!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<EncryptionStatus status="ready" publicKey={specialKey} />);

      expect(screen.getByText(/pk-!@#\$%\^&\*\(\)/)).toBeInTheDocument();
    });

    it('should handle public key with unicode characters', () => {
      const unicodeKey = 'pk-日本語-中文-한국어-العربية';
      render(<EncryptionStatus status="ready" publicKey={unicodeKey} />);

      expect(screen.getByText(/pk-日本語/)).toBeInTheDocument();
    });

    it('should handle public key with line breaks', () => {
      const keyWithBreaks = 'pk-line1\nline2\rline3';
      render(<EncryptionStatus status="ready" publicKey={keyWithBreaks} />);

      // Should display without breaking layout
      const codeElement = screen.getByText(/pk-line1/);
      expect(codeElement).toBeInTheDocument();
    });

    it('should handle extremely long public key', () => {
      const extremelyLongKey = 'pk-' + 'a'.repeat(10000);
      render(<EncryptionStatus status="ready" publicKey={extremelyLongKey} />);

      // Should be truncated to 64 chars + "..."
      const keyElement = screen.getByText(/pk-aaaa/);
      expect(keyElement.textContent?.length).toBeLessThan(100);
    });
  });

  describe('visual consistency', () => {
    it('should use consistent icon size across statuses', () => {
      const { container: pendingContainer } = render(<EncryptionStatus status="pending" />);
      const { container: readyContainer } = render(<EncryptionStatus status="ready" />);
      const { container: activeContainer } = render(<EncryptionStatus status="active" />);

      const pendingIcon = pendingContainer.querySelector('svg');
      const readyIcon = readyContainer.querySelector('svg');
      const activeIcon = activeContainer.querySelector('svg');

      expect(pendingIcon).toHaveClass('h-5', 'w-5');
      expect(readyIcon).toHaveClass('h-5', 'w-5');
      expect(activeIcon).toHaveClass('h-5', 'w-5');
    });

    it('should use consistent padding across statuses', () => {
      const { container: pendingContainer } = render(<EncryptionStatus status="pending" />);
      const { container: readyContainer } = render(<EncryptionStatus status="ready" />);

      expect(pendingContainer.querySelector('.p-4')).toBeInTheDocument();
      expect(readyContainer.querySelector('.p-4')).toBeInTheDocument();
    });

    it('should use consistent border radius', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should render properly on narrow viewports', () => {
      const { container } = render(<EncryptionStatus status="ready" publicKey="pk-test-key-123" />);

      const codeElement = container.querySelector('code');
      expect(codeElement).toHaveClass('break-all');
    });

    it('should wrap text content appropriately', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const flexContainer = container.querySelector('.flex-1');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('type safety', () => {
    it('should only accept valid status values', () => {
      // TypeScript would prevent this, but we test runtime behavior
      render(<EncryptionStatus status="pending" />);
      render(<EncryptionStatus status="ready" />);
      render(<EncryptionStatus status="active" />);

      // All should render without errors
      expect(screen.getAllByRole('heading')).toHaveLength(3);
    });
  });

  describe('icon rendering', () => {
    it('should render lock icon SVG path', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const path = container.querySelector('svg path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d');
    });

    it('should have proper stroke attributes on SVG', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('should apply color classes to icon', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      const iconContainer = container.querySelector('.text-amber-600');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('configuration object', () => {
    it('should render all configuration properties for pending', () => {
      const { container } = render(<EncryptionStatus status="pending" />);

      expect(container.querySelector('.bg-amber-50')).toBeInTheDocument();
      expect(container.querySelector('.border-amber-200')).toBeInTheDocument();
      expect(container.querySelector('.text-amber-600')).toBeInTheDocument();
      expect(screen.getByText('Encryption Pending')).toBeInTheDocument();
      expect(screen.getByText(/Complete the key ceremony/i)).toBeInTheDocument();
    });

    it('should render all configuration properties for ready', () => {
      const { container } = render(<EncryptionStatus status="ready" />);

      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
      expect(container.querySelector('.border-green-200')).toBeInTheDocument();
      expect(container.querySelector('.text-green-600')).toBeInTheDocument();
      expect(screen.getByText('Encryption Ready')).toBeInTheDocument();
      expect(screen.getByText(/Threshold key ceremony complete/i)).toBeInTheDocument();
    });

    it('should render all configuration properties for active', () => {
      const { container } = render(<EncryptionStatus status="active" />);

      expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
      expect(container.querySelector('.border-blue-200')).toBeInTheDocument();
      expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
      expect(screen.getByText('Encryption Active')).toBeInTheDocument();
      expect(screen.getByText(/Voters are submitting/i)).toBeInTheDocument();
    });
  });

  describe('text content completeness', () => {
    it('should display complete description for pending status', () => {
      render(<EncryptionStatus status="pending" />);

      expect(screen.getByText('Complete the key ceremony to enable vote encryption.')).toBeInTheDocument();
    });

    it('should display complete description for ready status', () => {
      render(<EncryptionStatus status="ready" />);

      expect(screen.getByText('Threshold key ceremony complete. Votes will be encrypted.')).toBeInTheDocument();
    });

    it('should display complete description for active status', () => {
      render(<EncryptionStatus status="active" />);

      expect(screen.getByText('Voters are submitting encrypted ballots.')).toBeInTheDocument();
    });
  });

  describe('component reusability', () => {
    it('should render multiple instances independently', () => {
      const { container } = render(
        <>
          <EncryptionStatus status="pending" />
          <EncryptionStatus status="ready" publicKey="pk-123" />
          <EncryptionStatus status="active" publicKey="pk-456" />
        </>
      );

      expect(screen.getByText('Encryption Pending')).toBeInTheDocument();
      expect(screen.getByText('Encryption Ready')).toBeInTheDocument();
      expect(screen.getByText('Encryption Active')).toBeInTheDocument();
      expect(screen.getAllByText(/Public Key/)).toHaveLength(2);
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<EncryptionStatus status="pending" />);

      for (let i = 0; i < 10; i++) {
        rerender(<EncryptionStatus status="ready" publicKey={`pk-${i}`} />);
      }

      expect(screen.getByText('Encryption Ready')).toBeInTheDocument();
      expect(screen.getByText(/pk-9/)).toBeInTheDocument();
    });
  });

  describe('XSS prevention', () => {
    it('should safely render XSS payload in public key', () => {
      const xssPayload = '<script>alert("xss")</script>';
      render(<EncryptionStatus status="ready" publicKey={xssPayload} />);

      // React should escape the content
      expect(screen.getByText(/<script>alert\("xss"\)<\/script>\.\.\./)).toBeInTheDocument();
    });

    it('should safely render HTML entities in public key', () => {
      const htmlEntities = '&lt;div&gt;&amp;&quot;&#39;';
      render(<EncryptionStatus status="ready" publicKey={htmlEntities} />);

      expect(screen.getByText(/&lt;div&gt;&amp;&quot;&#39;\.\.\./)).toBeInTheDocument();
    });
  });
});
