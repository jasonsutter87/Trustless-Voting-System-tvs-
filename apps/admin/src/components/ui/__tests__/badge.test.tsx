/**
 * Badge Component Tests
 * Comprehensive tests for the Badge component and its variants
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, badgeVariants } from '../badge';
import { xssPayloads } from '@/__tests__/utils/test-utils';

describe('Badge', () => {
  describe('Basic Rendering', () => {
    it('should render badge element', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render as span element by default', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge').tagName).toBe('SPAN');
    });

    it('should have data-slot attribute', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'badge');
    });

    it('should apply default classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded-full', 'border', 'px-2', 'py-0.5', 'text-xs', 'font-medium');
    });
  });

  describe('Variant - Default', () => {
    it('should render with default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground', 'border-transparent');
    });

    it('should render default variant explicitly', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should apply default variant styles', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('border-transparent');
    });
  });

  describe('Variant - Secondary', () => {
    it('should render with secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground', 'border-transparent');
    });

    it('should display secondary variant text', () => {
      render(<Badge variant="secondary">Secondary Badge</Badge>);
      expect(screen.getByText('Secondary Badge')).toBeInTheDocument();
    });
  });

  describe('Variant - Destructive', () => {
    it('should render with destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-destructive', 'text-white', 'border-transparent');
    });

    it('should apply destructive focus styles', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('focus-visible:ring-destructive/20');
    });

    it('should display destructive variant text', () => {
      render(<Badge variant="destructive">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Variant - Outline', () => {
    it('should render with outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-foreground');
    });

    it('should display outline variant text', () => {
      render(<Badge variant="outline">Outline Badge</Badge>);
      expect(screen.getByText('Outline Badge')).toBeInTheDocument();
    });

    it('should have border for outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('border');
    });
  });

  describe('All Variants Rendering', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const;

    variants.forEach((variant) => {
      it(`should render ${variant} variant correctly`, () => {
        render(<Badge variant={variant} data-testid={`badge-${variant}`}>{variant}</Badge>);
        expect(screen.getByTestId(`badge-${variant}`)).toBeInTheDocument();
        expect(screen.getByText(variant)).toBeInTheDocument();
      });
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Badge className="custom-class" data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class', 'inline-flex', 'items-center');
    });

    it('should allow multiple custom classes', () => {
      render(<Badge className="class-1 class-2 class-3" data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('should handle empty className', () => {
      render(<Badge className="" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      render(<Badge className={undefined} data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('should allow overriding variant styles with className', () => {
      render(<Badge variant="default" className="bg-blue-500" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('bg-blue-500');
    });
  });

  describe('asChild Prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Badge asChild data-testid="badge">
          <a href="/test">Link Badge</a>
        </Badge>
      );

      const element = screen.getByTestId('badge');
      expect(element.tagName).toBe('A');
      expect(element).toHaveAttribute('href', '/test');
    });

    it('should render as span when asChild is false', () => {
      render(<Badge asChild={false} data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge').tagName).toBe('SPAN');
    });

    it('should work with button as child', () => {
      const handleClick = jest.fn();
      render(
        <Badge asChild>
          <button onClick={handleClick} data-testid="button">
            Click Me
          </button>
        </Badge>
      );

      expect(screen.getByTestId('button').tagName).toBe('BUTTON');
    });

    it('should work with div as child', () => {
      render(
        <Badge asChild>
          <div data-testid="div">Div Badge</div>
        </Badge>
      );

      expect(screen.getByTestId('div').tagName).toBe('DIV');
    });

    it('should apply badge classes to child element', () => {
      render(
        <Badge asChild variant="secondary">
          <a href="#" data-testid="link">Link</a>
        </Badge>
      );

      expect(screen.getByTestId('link')).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
  });

  describe('Badge with Icons', () => {
    it('should render with icon', () => {
      render(
        <Badge data-testid="badge">
          <svg data-testid="icon">Icon</svg>
          Badge Text
        </Badge>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('should apply icon size styles', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('[&>svg]:size-3');
    });

    it('should apply icon gap', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('gap-1');
    });

    it('should prevent pointer events on icon', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('[&>svg]:pointer-events-none');
    });

    it('should render with multiple icons', () => {
      render(
        <Badge>
          <svg data-testid="icon1">Icon1</svg>
          Text
          <svg data-testid="icon2">Icon2</svg>
        </Badge>
      );

      expect(screen.getByTestId('icon1')).toBeInTheDocument();
      expect(screen.getByTestId('icon2')).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('should forward id prop', () => {
      render(<Badge id="test-badge" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('id', 'test-badge');
    });

    it('should forward aria-label prop', () => {
      render(<Badge aria-label="Status badge" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('aria-label', 'Status badge');
    });

    it('should forward role prop', () => {
      render(<Badge role="status" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('role', 'status');
    });

    it('should forward data attributes', () => {
      render(<Badge data-custom="value" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('data-custom', 'value');
    });

    it('should forward onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Badge onClick={handleClick} data-testid="badge">Badge</Badge>);

      await user.click(screen.getByTestId('badge'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should forward title prop', () => {
      render(<Badge title="Tooltip" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('title', 'Tooltip');
    });

    it('should forward style prop', () => {
      render(<Badge style={{ color: 'red' }} data-testid="badge">Badge</Badge>);
      // Browser converts 'red' to 'rgb(255, 0, 0)'
      expect(screen.getByTestId('badge')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
  });

  describe('Accessibility - ARIA Attributes', () => {
    it('should support aria-invalid', () => {
      render(<Badge aria-invalid="true" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should apply error styles when aria-invalid', () => {
      render(<Badge aria-invalid="true" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('aria-invalid:border-destructive', 'aria-invalid:ring-destructive/20');
    });

    it('should support aria-describedby', () => {
      render(<Badge aria-describedby="desc-id" data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should support aria-live for status badges', () => {
      render(<Badge aria-live="polite" role="status" data-testid="badge">Status</Badge>);
      expect(screen.getByTestId('badge')).toHaveAttribute('aria-live', 'polite');
    });

    it('should be accessible with screen readers', () => {
      render(<Badge role="status" aria-label="Active status">Active</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Active status');
    });
  });

  describe('Focus States', () => {
    it('should apply focus-visible styles', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50', 'focus-visible:ring-[3px]');
    });

    it('should be focusable when interactive', () => {
      render(<Badge tabIndex={0} data-testid="badge">Badge</Badge>);
      const badge = screen.getByTestId('badge');
      badge.focus();
      expect(document.activeElement).toBe(badge);
    });

    it('should support onFocus handler', () => {
      const handleFocus = jest.fn();
      render(<Badge tabIndex={0} onFocus={handleFocus} data-testid="badge">Badge</Badge>);

      const badge = screen.getByTestId('badge');
      badge.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should support onBlur handler', () => {
      const handleBlur = jest.fn();
      render(<Badge tabIndex={0} onBlur={handleBlur} data-testid="badge">Badge</Badge>);

      const badge = screen.getByTestId('badge');
      badge.focus();
      badge.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interactive Badge as Link', () => {
    it('should render as clickable link', async () => {
      const user = userEvent.setup();
      render(
        <Badge asChild>
          <a href="#test" data-testid="link">Link Badge</a>
        </Badge>
      );

      expect(screen.getByTestId('link')).toHaveAttribute('href', '#test');
    });

    it('should apply hover styles for link badges', () => {
      render(
        <Badge asChild variant="default">
          <a href="#" data-testid="link">Link</a>
        </Badge>
      );

      expect(screen.getByTestId('link')).toHaveClass('[a&]:hover:bg-primary/90');
    });

    it('should handle link navigation', () => {
      render(
        <Badge asChild>
          <a href="/path" data-testid="link">Navigate</a>
        </Badge>
      );

      expect(screen.getByTestId('link')).toHaveAttribute('href', '/path');
    });
  });

  describe('XSS Security', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely render XSS in badge content: ${payload.substring(0, 30)}...`, () => {
        render(<Badge>{payload}</Badge>);
        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely handle XSS in aria-label: ${payload.substring(0, 30)}...`, () => {
        render(<Badge aria-label={payload} data-testid="badge">Badge</Badge>);
        expect(screen.getByTestId('badge')).toHaveAttribute('aria-label', payload);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty badge', () => {
      render(<Badge data-testid="badge" />);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(500);
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should apply whitespace-nowrap', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('whitespace-nowrap');
    });

    it('should handle numeric content', () => {
      render(<Badge>{999}</Badge>);
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should handle single character', () => {
      render(<Badge>!</Badge>);
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()';
      render(<Badge>{specialChars}</Badge>);
      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      const unicode = '你好 مرحبا שלום';
      render(<Badge>{unicode}</Badge>);
      expect(screen.getByText(unicode)).toBeInTheDocument();
    });

    it('should handle emojis', () => {
      const emojis = '✅ ❌ ⚠️ ℹ️';
      render(<Badge>{emojis}</Badge>);
      expect(screen.getByText(emojis)).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      render(
        <Badge>
          {null}
          Valid
        </Badge>
      );
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <Badge>
          {undefined}
          Valid
        </Badge>
      );
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('should handle boolean children gracefully', () => {
      render(
        <Badge>
          {false}
          {true}
          Valid
        </Badge>
      );
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('should handle whitespace', () => {
      render(<Badge>  Badge  </Badge>);
      expect(screen.getByText(/Badge/)).toBeInTheDocument();
    });
  });

  describe('Status Badge Use Cases', () => {
    it('should render success status badge', () => {
      render(<Badge variant="default" className="bg-green-500">Success</Badge>);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should render error status badge', () => {
      render(<Badge variant="destructive">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render warning status badge', () => {
      render(<Badge variant="outline" className="border-yellow-500">Warning</Badge>);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should render info status badge', () => {
      render(<Badge variant="secondary">Info</Badge>);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Sizing and Layout', () => {
    it('should apply w-fit class', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('w-fit');
    });

    it('should apply shrink-0 class', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('shrink-0');
    });

    it('should apply overflow-hidden class', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('overflow-hidden');
    });

    it('should use rounded-full for circular appearance', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('rounded-full');
    });

    it('should allow size customization via className', () => {
      render(<Badge className="px-4 py-2 text-base" data-testid="badge">Large</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });

  describe('badgeVariants Function', () => {
    it('should export badgeVariants function', () => {
      expect(badgeVariants).toBeDefined();
      expect(typeof badgeVariants).toBe('function');
    });

    it('should generate correct classes for default variant', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary');
    });

    it('should generate correct classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
    });

    it('should generate correct classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
    });

    it('should generate correct classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' });
      expect(classes).toContain('text-foreground');
    });
  });

  describe('Transition Effects', () => {
    it('should apply transition classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('transition-[color,box-shadow]');
    });
  });

  describe('Event Handlers', () => {
    it('should call onMouseEnter handler', async () => {
      const handleMouseEnter = jest.fn();
      const user = userEvent.setup();
      render(<Badge onMouseEnter={handleMouseEnter} data-testid="badge">Badge</Badge>);

      await user.hover(screen.getByTestId('badge'));

      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('should call onMouseLeave handler', async () => {
      const handleMouseLeave = jest.fn();
      const user = userEvent.setup();
      render(<Badge onMouseLeave={handleMouseLeave} data-testid="badge">Badge</Badge>);

      await user.hover(screen.getByTestId('badge'));
      await user.unhover(screen.getByTestId('badge'));

      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown handler when focusable', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      render(<Badge tabIndex={0} onKeyDown={handleKeyDown} data-testid="badge">Badge</Badge>);

      const badge = screen.getByTestId('badge');
      badge.focus();
      await user.keyboard('{Enter}');

      expect(handleKeyDown).toHaveBeenCalled();
    });
  });
});
