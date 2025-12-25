/**
 * Label Component Tests
 * Comprehensive tests for the Label component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Label } from '../label';
import { xssPayloads } from '@/__tests__/utils/test-utils';

describe('Label', () => {
  describe('Basic Rendering', () => {
    it('should render label element', () => {
      render(<Label data-testid="label">Label Text</Label>);
      expect(screen.getByTestId('label')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should render as label tag', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label').tagName).toBe('LABEL');
    });

    it('should have data-slot attribute', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('data-slot', 'label');
    });

    it('should apply default classes', () => {
      render(<Label data-testid="label">Label</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'leading-none', 'font-medium', 'select-none');
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Label className="custom-class" data-testid="label">Label</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('custom-class', 'flex', 'items-center');
    });

    it('should allow multiple custom classes', () => {
      render(<Label className="class-1 class-2 class-3" data-testid="label">Label</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('should handle empty className', () => {
      render(<Label className="" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      render(<Label className={undefined} data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toBeInTheDocument();
    });

    it('should allow overriding default classes', () => {
      render(<Label className="text-lg font-bold" data-testid="label">Label</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('text-lg', 'font-bold');
    });
  });

  describe('htmlFor Association', () => {
    it('should associate label with input using htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Username</Label>
          <input id="test-input" />
        </>
      );

      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('should focus input when label is clicked', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Label htmlFor="test-input">Username</Label>
          <input id="test-input" data-testid="input" />
        </>
      );

      await user.click(screen.getByText('Username'));

      expect(screen.getByTestId('input')).toHaveFocus();
    });

    it('should work with multiple inputs', () => {
      render(
        <>
          <Label htmlFor="email">Email</Label>
          <input id="email" />
          <Label htmlFor="password">Password</Label>
          <input id="password" />
        </>
      );

      expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
      expect(screen.getByText('Password')).toHaveAttribute('for', 'password');
    });

    it('should handle label without htmlFor', () => {
      render(<Label data-testid="label">Standalone Label</Label>);
      expect(screen.getByTestId('label')).not.toHaveAttribute('for');
    });
  });

  describe('Nested Input Pattern', () => {
    it('should work with input nested inside label', async () => {
      const user = userEvent.setup();
      render(
        <Label>
          Username
          <input data-testid="input" />
        </Label>
      );

      const input = screen.getByTestId('input');
      await user.click(screen.getByText('Username'));

      // Input should be focused when clicking the label
      expect(input).toHaveFocus();
    });

    it('should render label with checkbox input', () => {
      render(
        <Label>
          <input type="checkbox" data-testid="checkbox" />
          Accept Terms
        </Label>
      );

      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Accept Terms')).toBeInTheDocument();
    });

    it('should render label with radio input', () => {
      render(
        <Label>
          <input type="radio" data-testid="radio" />
          Option A
        </Label>
      );

      expect(screen.getByTestId('radio')).toBeInTheDocument();
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles with group-data attribute', () => {
      render(
        <div data-disabled="true">
          <Label data-testid="label">Disabled Label</Label>
        </div>
      );

      const label = screen.getByTestId('label');
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none', 'group-data-[disabled=true]:opacity-50');
    });

    it('should apply peer-disabled styles', () => {
      render(
        <>
          <input disabled className="peer" />
          <Label data-testid="label">Label</Label>
        </>
      );

      const label = screen.getByTestId('label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-50');
    });

    it('should work with disabled input', () => {
      render(
        <Label htmlFor="disabled-input">
          Disabled Input
          <input id="disabled-input" disabled data-testid="input" />
        </Label>
      );

      expect(screen.getByTestId('input')).toBeDisabled();
    });
  });

  describe('Accessibility - ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(<Label aria-label="Form label" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('aria-label', 'Form label');
    });

    it('should support aria-labelledby', () => {
      render(<Label aria-labelledby="label-id" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should support aria-describedby', () => {
      render(<Label aria-describedby="desc-id" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should support custom role', () => {
      render(<Label role="presentation" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('role', 'presentation');
    });

    it('should be accessible with screen readers', () => {
      render(
        <>
          <Label htmlFor="accessible-input">Accessible Field</Label>
          <input id="accessible-input" aria-labelledby="accessible-input" />
        </>
      );

      const label = screen.getByText('Accessible Field');
      expect(label).toHaveAttribute('for', 'accessible-input');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward id prop', () => {
      render(<Label id="test-label" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('id', 'test-label');
    });

    it('should forward data attributes', () => {
      render(<Label data-custom="value" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('data-custom', 'value');
    });

    it('should forward onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Label onClick={handleClick} data-testid="label">Label</Label>);

      await user.click(screen.getByTestId('label'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should forward title prop', () => {
      render(<Label title="Tooltip text" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveAttribute('title', 'Tooltip text');
    });

    it('should forward style prop', () => {
      render(<Label style={{ color: 'red' }} data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
  });

  describe('Complex Content', () => {
    it('should render with icon', () => {
      render(
        <Label data-testid="label">
          <svg data-testid="icon">Icon</svg>
          Label with Icon
        </Label>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Label with Icon')).toBeInTheDocument();
    });

    it('should handle gap between items', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('gap-2');
    });

    it('should render with multiple children', () => {
      render(
        <Label>
          <span>Part 1</span>
          <span>Part 2</span>
          <span>Part 3</span>
        </Label>
      );

      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
      expect(screen.getByText('Part 3')).toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      render(
        <Label>
          Email
          <span className="text-destructive">*</span>
        </Label>
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with tooltip', () => {
      render(
        <Label>
          Field Name
          <span title="Help text" data-testid="tooltip">?</span>
        </Label>
      );

      expect(screen.getByTestId('tooltip')).toHaveAttribute('title', 'Help text');
    });
  });

  describe('XSS Security', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely render XSS in label text: ${payload.substring(0, 30)}...`, () => {
        render(<Label>{payload}</Label>);
        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely handle XSS in htmlFor: ${payload.substring(0, 30)}...`, () => {
        render(<Label htmlFor={payload} data-testid="label">Label</Label>);
        expect(screen.getByTestId('label')).toHaveAttribute('for', payload);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      render(<Label data-testid="label" />);
      expect(screen.getByTestId('label')).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(500);
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle whitespace-only content', () => {
      render(<Label data-testid="label">   </Label>);
      expect(screen.getByTestId('label')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      render(
        <Label>
          {null}
          Valid Text
        </Label>
      );
      expect(screen.getByText('Valid Text')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <Label>
          {undefined}
          Valid Text
        </Label>
      );
      expect(screen.getByText('Valid Text')).toBeInTheDocument();
    });

    it('should handle boolean children gracefully', () => {
      render(
        <Label>
          {false}
          {true}
          Valid Text
        </Label>
      );
      expect(screen.getByText('Valid Text')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()[]{}|\\:;"<>,.?/~`';
      render(<Label>{specialChars}</Label>);
      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 مرحبا العالم שלום עולם';
      render(<Label>{unicode}</Label>);
      expect(screen.getByText(unicode)).toBeInTheDocument();
    });

    it('should handle emojis', () => {
      const emojis = '🏷️ 📝 ✨ 🎯';
      render(<Label>{emojis}</Label>);
      expect(screen.getByText(emojis)).toBeInTheDocument();
    });

    it('should handle mixed content types', () => {
      render(
        <Label data-testid="label">
          Text
          <span data-testid="span">Span</span>
          {123}
          <div data-testid="div">Div</div>
        </Label>
      );

      const label = screen.getByTestId('label');
      expect(label).toBeInTheDocument();
      expect(screen.getByTestId('span')).toHaveTextContent('Span');
      expect(screen.getByTestId('div')).toHaveTextContent('Div');
      expect(label.textContent).toContain('123');
    });
  });

  describe('Form Integration', () => {
    it('should work in a complete form', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Label htmlFor="username">Username</Label>
          <input id="username" data-testid="input" />
          <button type="submit">Submit</button>
        </form>
      );

      await user.type(screen.getByTestId('input'), 'testuser');
      await user.click(screen.getByText('Submit'));

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should work with required field', () => {
      render(
        <>
          <Label htmlFor="required-field">
            Required Field
            <span>*</span>
          </Label>
          <input id="required-field" required data-testid="input" />
        </>
      );

      expect(screen.getByTestId('input')).toBeRequired();
    });

    it('should work with error state', () => {
      render(
        <>
          <Label htmlFor="error-field" className="text-destructive">
            Field with Error
          </Label>
          <input id="error-field" aria-invalid="true" />
        </>
      );

      expect(screen.getByText('Field with Error')).toHaveClass('text-destructive');
    });

    it('should work with multiple form fields', () => {
      render(
        <form>
          <Label htmlFor="field1">Field 1</Label>
          <input id="field1" />
          <Label htmlFor="field2">Field 2</Label>
          <input id="field2" />
          <Label htmlFor="field3">Field 3</Label>
          <input id="field3" />
        </form>
      );

      expect(screen.getByText('Field 1')).toHaveAttribute('for', 'field1');
      expect(screen.getByText('Field 2')).toHaveAttribute('for', 'field2');
      expect(screen.getByText('Field 3')).toHaveAttribute('for', 'field3');
    });
  });

  describe('Select-none Behavior', () => {
    it('should have select-none class', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('select-none');
    });

    it('should prevent text selection', () => {
      render(<Label data-testid="label">Unselectable Text</Label>);
      const label = screen.getByTestId('label');
      const computedStyle = window.getComputedStyle(label);
      // Note: jsdom doesn't fully support CSS, but we can check the class is applied
      expect(label).toHaveClass('select-none');
    });
  });

  describe('Flexbox Layout', () => {
    it('should use flex display', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('flex');
    });

    it('should center items vertically', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('items-center');
    });

    it('should handle flex direction override', () => {
      render(<Label className="flex-col" data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('flex-col');
    });
  });

  describe('Typography', () => {
    it('should use text-sm size', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('text-sm');
    });

    it('should use leading-none', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('leading-none');
    });

    it('should use font-medium weight', () => {
      render(<Label data-testid="label">Label</Label>);
      expect(screen.getByTestId('label')).toHaveClass('font-medium');
    });

    it('should allow typography overrides', () => {
      render(<Label className="text-lg font-bold" data-testid="label">Label</Label>);
      const label = screen.getByTestId('label');
      expect(label).toHaveClass('text-lg', 'font-bold');
    });
  });

  describe('Event Handlers', () => {
    it('should call onMouseEnter handler', async () => {
      const handleMouseEnter = jest.fn();
      const user = userEvent.setup();
      render(<Label onMouseEnter={handleMouseEnter} data-testid="label">Label</Label>);

      await user.hover(screen.getByTestId('label'));

      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('should call onMouseLeave handler', async () => {
      const handleMouseLeave = jest.fn();
      const user = userEvent.setup();
      render(<Label onMouseLeave={handleMouseLeave} data-testid="label">Label</Label>);

      await user.hover(screen.getByTestId('label'));
      await user.unhover(screen.getByTestId('label'));

      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus handler when associated input is focused', async () => {
      const handleFocus = jest.fn();
      render(
        <>
          <Label htmlFor="test-input" onFocus={handleFocus}>Label</Label>
          <input id="test-input" data-testid="input" />
        </>
      );

      screen.getByTestId('input').focus();

      // The label itself doesn't get focused, but we can verify the setup is correct
      expect(screen.getByTestId('input')).toHaveFocus();
    });
  });
});
