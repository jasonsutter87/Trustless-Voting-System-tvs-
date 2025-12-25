/**
 * Textarea Component Tests
 * Comprehensive tests for the Textarea component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';
import { xssPayloads } from '@/__tests__/utils/test-utils';

describe('Textarea', () => {
  describe('Basic Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });

    it('should render as textarea tag', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea').tagName).toBe('TEXTAREA');
    });

    it('should have data-slot attribute', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('data-slot', 'textarea');
    });

    it('should apply default classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('min-h-16', 'w-full', 'rounded-md', 'border', 'bg-transparent', 'px-3', 'py-2', 'shadow-xs');
    });

    it('should be empty by default', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveValue('');
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Textarea className="custom-class" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('custom-class', 'min-h-16', 'w-full');
    });

    it('should allow multiple custom classes', () => {
      render(<Textarea className="class-1 class-2 class-3" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('should handle empty className', () => {
      render(<Textarea className="" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      render(<Textarea className={undefined} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });

    it('should allow overriding default classes', () => {
      render(<Textarea className="min-h-32 w-1/2" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('min-h-32', 'w-1/2');
    });
  });

  describe('Value and onChange', () => {
    it('should render with initial value', () => {
      render(<Textarea value="Test Value" onChange={() => {}} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveValue('Test Value');
    });

    it('should render with defaultValue', () => {
      render(<Textarea defaultValue="Default Value" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveValue('Default Value');
    });

    it('should call onChange when typing', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Textarea onChange={handleChange} data-testid="textarea" />);

      await user.type(screen.getByTestId('textarea'), 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it('should update controlled value', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="textarea"
          />
        );
      };
      render(<TestComponent />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      await user.type(textarea, 'Test');

      expect(textarea.value).toBe('Test');
    });

    it('should handle empty value', () => {
      render(<Textarea value="" onChange={() => {}} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveValue('');
    });

    it('should handle multiline text', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });

      expect(textarea.value).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Placeholder', () => {
    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter text" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('placeholder', 'Enter text');
    });

    it('should apply placeholder styles', () => {
      render(<Textarea placeholder="Test" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('placeholder:text-muted-foreground');
    });

    it('should handle empty placeholder', () => {
      render(<Textarea placeholder="" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('placeholder', '');
    });

    it('should handle multiline placeholder text', () => {
      const placeholder = 'Enter description...\nMultiple lines supported';
      render(<Textarea placeholder={placeholder} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('placeholder', placeholder);
    });
  });

  describe('Disabled State', () => {
    it('should render disabled textarea', () => {
      render(<Textarea disabled data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Textarea disabled data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should not trigger onChange when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Textarea disabled onChange={handleChange} data-testid="textarea" />);

      await user.type(screen.getByTestId('textarea'), 'Test');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not be focusable when disabled', () => {
      render(<Textarea disabled data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      expect(document.activeElement).not.toBe(textarea);
    });
  });

  describe('ReadOnly State', () => {
    it('should render readonly textarea', () => {
      render(<Textarea readOnly data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('readonly');
    });

    it('should display value but not allow changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Textarea readOnly value="Read Only" onChange={handleChange} data-testid="textarea" />);

      await user.type(screen.getByTestId('textarea'), 'Test');

      expect(handleChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('textarea')).toHaveValue('Read Only');
    });

    it('should be focusable when readonly', () => {
      render(<Textarea readOnly data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      expect(document.activeElement).toBe(textarea);
    });
  });

  describe('Required State', () => {
    it('should render required textarea', () => {
      render(<Textarea required data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeRequired();
    });

    it('should have required attribute', () => {
      render(<Textarea required data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('required');
    });
  });

  describe('Accessibility - ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(<Textarea aria-label="Description input" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-label', 'Description input');
    });

    it('should support aria-labelledby', () => {
      render(<Textarea aria-labelledby="label-id" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should support aria-describedby', () => {
      render(<Textarea aria-describedby="desc-id" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should support aria-invalid', () => {
      render(<Textarea aria-invalid="true" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should apply error styles when aria-invalid', () => {
      render(<Textarea aria-invalid="true" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('aria-invalid:border-destructive', 'aria-invalid:ring-destructive/20');
    });

    it('should support aria-required', () => {
      render(<Textarea aria-required="true" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-required', 'true');
    });

    it('should support aria-readonly', () => {
      render(<Textarea aria-readonly="true" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-readonly', 'true');
    });
  });

  describe('Focus States', () => {
    it('should be focusable', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      expect(document.activeElement).toBe(textarea);
    });

    it('should apply focus-visible styles', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50', 'focus-visible:ring-[3px]');
    });

    it('should call onFocus handler', () => {
      const handleFocus = jest.fn();
      render(<Textarea onFocus={handleFocus} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      textarea.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur handler', () => {
      const handleBlur = jest.fn();
      render(<Textarea onBlur={handleBlur} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      textarea.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Forwarding', () => {
    it('should forward id prop', () => {
      render(<Textarea id="test-textarea" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('id', 'test-textarea');
    });

    it('should forward name prop', () => {
      render(<Textarea name="description" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('name', 'description');
    });

    it('should forward autoFocus prop', () => {
      render(<Textarea autoFocus data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveFocus();
    });

    it('should forward maxLength prop', () => {
      render(<Textarea maxLength={100} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('maxLength', '100');
    });

    it('should forward minLength prop', () => {
      render(<Textarea minLength={10} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('minLength', '10');
    });

    it('should forward rows prop', () => {
      render(<Textarea rows={5} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
    });

    it('should forward cols prop', () => {
      render(<Textarea cols={50} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('cols', '50');
    });

    it('should forward wrap prop', () => {
      render(<Textarea wrap="soft" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('wrap', 'soft');
    });

    it('should forward data attributes', () => {
      render(<Textarea data-custom="value" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('data-custom', 'value');
    });

    it('should forward autoComplete prop', () => {
      render(<Textarea autoComplete="off" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('autocomplete', 'off');
    });

    it('should forward spellCheck prop', () => {
      render(<Textarea spellCheck={false} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('spellcheck', 'false');
    });
  });

  describe('Resize Behavior', () => {
    it('should apply field-sizing-content class', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('field-sizing-content');
    });

    it('should allow custom resize via className', () => {
      render(<Textarea className="resize-none" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('resize-none');
    });

    it('should allow vertical resize via className', () => {
      render(<Textarea className="resize-y" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('resize-y');
    });

    it('should allow horizontal resize via className', () => {
      render(<Textarea className="resize-x" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('resize-x');
    });
  });

  describe('XSS Security', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely handle XSS in value: ${payload.substring(0, 30)}...`, () => {
        render(<Textarea value={payload} onChange={() => {}} data-testid="textarea" />);
        const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
        expect(textarea.value).toBe(payload);
      });

      it(`should safely handle XSS in placeholder: ${payload.substring(0, 30)}...`, () => {
        render(<Textarea placeholder={payload} data-testid="textarea" />);
        expect(screen.getByTestId('textarea')).toHaveAttribute('placeholder', payload);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text input', () => {
      const longText = 'A'.repeat(5000);
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      // Use fireEvent.change for long text (userEvent.type is too slow)
      fireEvent.change(textarea, { target: { value: longText } });

      expect(textarea.value).toBe(longText);
    });

    it('should handle rapid typing', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      await user.type(textarea, 'QuickTyping');

      expect(textarea.value).toBe('QuickTyping');
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      // Use fireEvent.change for special characters (userEvent interprets [] and {} as key descriptors)
      fireEvent.change(textarea, { target: { value: specialChars } });

      expect(textarea.value).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界';
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: unicode } });

      expect(textarea.value).toBe(unicode);
    });

    it('should handle emojis', () => {
      const emojis = '😀😃😄😁';
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: emojis } });

      expect(textarea.value).toBe(emojis);
    });

    it('should handle tabs', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      await user.type(textarea, 'Before{Tab}After');

      expect(textarea.value).toContain('Before');
    });

    it('should handle whitespace', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      await user.type(textarea, '  leading and trailing  ');

      expect(textarea.value).toBe('  leading and trailing  ');
    });

    it('should handle clearing textarea', async () => {
      const user = userEvent.setup();
      render(<Textarea defaultValue="Clear me" data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      await user.clear(textarea);

      expect(textarea.value).toBe('');
    });

    it('should handle multiple paragraphs', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Paragraph 1\n\nParagraph 2\n\nParagraph 3' } });

      expect(textarea.value).toBe('Paragraph 1\n\nParagraph 2\n\nParagraph 3');
    });

    it('should handle maxLength constraint', async () => {
      const user = userEvent.setup();
      render(<Textarea maxLength={10} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      await user.type(textarea, '12345678901234567890');

      expect(textarea.value.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Event Handlers', () => {
    it('should call onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Textarea onClick={handleClick} data-testid="textarea" />);

      await user.click(screen.getByTestId('textarea'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown handler', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      render(<Textarea onKeyDown={handleKeyDown} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      await user.keyboard('a');

      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should call onKeyUp handler', async () => {
      const handleKeyUp = jest.fn();
      const user = userEvent.setup();
      render(<Textarea onKeyUp={handleKeyUp} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      await user.keyboard('a');

      expect(handleKeyUp).toHaveBeenCalled();
    });

    it('should call onInput handler', async () => {
      const handleInput = jest.fn();
      const user = userEvent.setup();
      render(<Textarea onInput={handleInput} data-testid="textarea" />);

      await user.type(screen.getByTestId('textarea'), 'test');

      expect(handleInput).toHaveBeenCalled();
    });

    it('should call onPaste handler', async () => {
      const handlePaste = jest.fn();
      const user = userEvent.setup();
      render(<Textarea onPaste={handlePaste} data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      await user.paste('pasted text');

      expect(handlePaste).toHaveBeenCalled();
    });
  });

  describe('Typography and Sizing', () => {
    it('should use text-base on default', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('text-base');
    });

    it('should use md:text-sm for responsive sizing', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('md:text-sm');
    });

    it('should have minimum height', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('min-h-16');
    });

    it('should be full width', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('w-full');
    });
  });

  describe('Border and Outline', () => {
    it('should have border', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('border', 'border-input');
    });

    it('should have no outline by default', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('outline-none');
    });

    it('should have rounded corners', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('rounded-md');
    });
  });

  describe('Transition Effects', () => {
    it('should apply transition classes', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('transition-[color,box-shadow]');
    });
  });

  describe('Form Integration', () => {
    it('should work in a form', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Textarea name="description" data-testid="textarea" />
          <button type="submit">Submit</button>
        </form>
      );

      await user.type(screen.getByTestId('textarea'), 'Form text');
      await user.click(screen.getByText('Submit'));

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should validate with required attribute', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Textarea required data-testid="textarea" />
          <button type="submit">Submit</button>
        </form>
      );

      await user.click(screen.getByText('Submit'));

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeRequired();
    });

    it('should work with labels', () => {
      render(
        <>
          <label htmlFor="desc">Description</label>
          <Textarea id="desc" data-testid="textarea" />
        </>
      );

      expect(screen.getByTestId('textarea')).toHaveAttribute('id', 'desc');
    });

    it('should update form data on change', async () => {
      const user = userEvent.setup();
      const TestForm = () => {
        const [formData, setFormData] = React.useState({ description: '' });
        return (
          <>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ description: e.target.value })}
              data-testid="textarea"
            />
            <div data-testid="output">{formData.description}</div>
          </>
        );
      };
      render(<TestForm />);

      await user.type(screen.getByTestId('textarea'), 'Test');

      expect(screen.getByTestId('output')).toHaveTextContent('Test');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode background class', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('dark:bg-input/30');
    });

    it('should apply dark mode invalid ring class', () => {
      render(<Textarea data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('dark:aria-invalid:ring-destructive/40');
    });
  });

  describe('Character Counter Integration', () => {
    it('should work with character counting', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={100}
              data-testid="textarea"
            />
            <div data-testid="counter">{value.length}/100</div>
          </>
        );
      };
      render(<TestComponent />);

      await user.type(screen.getByTestId('textarea'), 'Hello');

      expect(screen.getByTestId('counter')).toHaveTextContent('5/100');
    });
  });

  describe('Multi-line Input', () => {
    it('should handle line breaks correctly', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      // Use fireEvent.change for multiline text
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });

      const lines = textarea.value.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('Line 1');
      expect(lines[1]).toBe('Line 2');
    });

    it('should preserve multiple consecutive line breaks', () => {
      render(<Textarea data-testid="textarea" />);

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'A\n\n\nB' } });

      expect(textarea.value).toBe('A\n\n\nB');
    });
  });
});
