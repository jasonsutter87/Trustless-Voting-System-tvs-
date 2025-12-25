/**
 * Input Component Tests
 * Comprehensive tests for the Input component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';
import { xssPayloads } from '@/__tests__/utils/test-utils';

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('should render input element', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('should render as input tag', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input').tagName).toBe('INPUT');
    });

    it('should have data-slot attribute', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('data-slot', 'input');
    });

    it('should apply default classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-9', 'w-full', 'rounded-md', 'border', 'bg-transparent', 'px-3', 'py-1', 'shadow-xs');
    });

    it('should render with default type text', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      // When type is not specified, it defaults to text but the attribute may not be present
      expect(input.type).toBe('text');
    });
  });

  describe('Input Types', () => {
    const inputTypes = [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'search',
      'date',
      'time',
      'datetime-local',
      'month',
      'week',
      'color',
      'file',
      'hidden',
      'range',
      'checkbox',
      'radio',
    ];

    inputTypes.forEach((type) => {
      it(`should render with type="${type}"`, () => {
        render(<Input type={type as any} data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveAttribute('type', type);
      });
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class', 'h-9', 'w-full');
    });

    it('should allow multiple custom classes', () => {
      render(<Input className="class-1 class-2 class-3" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('should handle empty className', () => {
      render(<Input className="" data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      render(<Input className={undefined} data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
    });

    it('should allow overriding default classes', () => {
      render(<Input className="h-12 w-1/2" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-12', 'w-1/2');
    });
  });

  describe('Value and onChange', () => {
    it('should render with initial value', () => {
      render(<Input value="Test Value" onChange={() => {}} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('Test Value');
    });

    it('should render with defaultValue', () => {
      render(<Input defaultValue="Default Value" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('Default Value');
    });

    it('should call onChange when typing', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} data-testid="input" />);

      await user.type(screen.getByTestId('input'), 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it('should update controlled value', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="input"
          />
        );
      };
      render(<TestComponent />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.type(input, 'Test');

      expect(input.value).toBe('Test');
    });

    it('should handle empty value', () => {
      render(<Input value="" onChange={() => {}} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('');
    });

    it('should handle numeric value for number input', () => {
      render(<Input type="number" value="123" onChange={() => {}} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue(123);
    });
  });

  describe('Placeholder', () => {
    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('placeholder', 'Enter text');
    });

    it('should apply placeholder styles', () => {
      render(<Input placeholder="Test" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('placeholder:text-muted-foreground');
    });

    it('should handle empty placeholder', () => {
      render(<Input placeholder="" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('placeholder', '');
    });

    it('should handle special characters in placeholder', () => {
      const placeholder = 'Email (e.g., user@example.com)';
      render(<Input placeholder={placeholder} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('placeholder', placeholder);
    });
  });

  describe('Disabled State', () => {
    it('should render disabled input', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should not trigger onChange when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input disabled onChange={handleChange} data-testid="input" />);

      await user.type(screen.getByTestId('input'), 'Test');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not be focusable when disabled', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      input.focus();
      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('ReadOnly State', () => {
    it('should render readonly input', () => {
      render(<Input readOnly data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('readonly');
    });

    it('should display value but not allow changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input readOnly value="Read Only" onChange={handleChange} data-testid="input" />);

      await user.type(screen.getByTestId('input'), 'Test');

      expect(handleChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('input')).toHaveValue('Read Only');
    });

    it('should be focusable when readonly', () => {
      render(<Input readOnly data-testid="input" />);
      const input = screen.getByTestId('input');
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Required State', () => {
    it('should render required input', () => {
      render(<Input required data-testid="input" />);
      expect(screen.getByTestId('input')).toBeRequired();
    });

    it('should have required attribute', () => {
      render(<Input required data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('required');
    });
  });

  describe('Accessibility - ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Username input" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-label', 'Username input');
    });

    it('should support aria-labelledby', () => {
      render(<Input aria-labelledby="label-id" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="desc-id" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should apply error styles when aria-invalid', () => {
      render(<Input aria-invalid="true" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('aria-invalid:border-destructive', 'aria-invalid:ring-destructive/20');
    });

    it('should support aria-required', () => {
      render(<Input aria-required="true" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-required', 'true');
    });

    it('should support aria-readonly', () => {
      render(<Input aria-readonly="true" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('aria-readonly', 'true');
    });
  });

  describe('Focus States', () => {
    it('should be focusable', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('should apply focus-visible styles', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50', 'focus-visible:ring-[3px]');
    });

    it('should call onFocus handler', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur handler', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Forwarding', () => {
    it('should forward id prop', () => {
      render(<Input id="test-input" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('id', 'test-input');
    });

    it('should forward name prop', () => {
      render(<Input name="username" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('name', 'username');
    });

    it('should forward autoComplete prop', () => {
      render(<Input autoComplete="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('autocomplete', 'email');
    });

    it('should forward autoFocus prop', () => {
      render(<Input autoFocus data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveFocus();
    });

    it('should forward maxLength prop', () => {
      render(<Input maxLength={10} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('maxLength', '10');
    });

    it('should forward minLength prop', () => {
      render(<Input minLength={3} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('minLength', '3');
    });

    it('should forward pattern prop', () => {
      render(<Input pattern="[0-9]*" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('pattern', '[0-9]*');
    });

    it('should forward min prop for number input', () => {
      render(<Input type="number" min={0} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('min', '0');
    });

    it('should forward max prop for number input', () => {
      render(<Input type="number" max={100} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('max', '100');
    });

    it('should forward step prop for number input', () => {
      render(<Input type="number" step={0.1} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('step', '0.1');
    });

    it('should forward data attributes', () => {
      render(<Input data-custom="value" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('File Input', () => {
    it('should render file input', () => {
      render(<Input type="file" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'file');
    });

    it('should apply file input styles', () => {
      render(<Input type="file" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('file:text-foreground', 'file:inline-flex');
    });

    it('should support accept attribute', () => {
      render(<Input type="file" accept="image/*" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('accept', 'image/*');
    });

    it('should support multiple attribute', () => {
      render(<Input type="file" multiple data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('multiple');
    });
  });

  describe('XSS Security', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely handle XSS in value: ${payload.substring(0, 30)}...`, () => {
        render(<Input value={payload} onChange={() => {}} data-testid="input" />);
        const input = screen.getByTestId('input') as HTMLInputElement;
        expect(input.value).toBe(payload);
      });

      it(`should safely handle XSS in placeholder: ${payload.substring(0, 30)}...`, () => {
        render(<Input placeholder={payload} data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveAttribute('placeholder', payload);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text input', () => {
      const longText = 'A'.repeat(1000);
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      // Use fireEvent.change for long text (userEvent.type is too slow)
      fireEvent.change(input, { target: { value: longText } });

      expect(input.value).toBe(longText);
    });

    it('should handle rapid typing', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.type(input, 'QuickTyping');

      expect(input.value).toBe('QuickTyping');
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      // Use fireEvent.change for special characters (userEvent interprets [] and {} as key descriptors)
      fireEvent.change(input, { target: { value: specialChars } });

      expect(input.value).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界';
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: unicode } });

      expect(input.value).toBe(unicode);
    });

    it('should handle emojis', () => {
      const emojis = '😀😃😄😁';
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: emojis } });

      expect(input.value).toBe(emojis);
    });

    it('should handle cut, copy, paste events', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="Test Text" data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      input.select();
      await user.copy();

      expect(input.value).toBe('Test Text');
    });

    it('should handle whitespace', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.type(input, '  leading and trailing  ');

      expect(input.value).toBe('  leading and trailing  ');
    });

    it('should handle clearing input', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="Clear me" data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.clear(input);

      expect(input.value).toBe('');
    });

    it('should handle negative numbers', async () => {
      const user = userEvent.setup();
      render(<Input type="number" data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.type(input, '-123');

      expect(input.value).toBe('-123');
    });

    it('should handle decimal numbers', async () => {
      const user = userEvent.setup();
      render(<Input type="number" data-testid="input" />);

      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.type(input, '123.45');

      expect(input.value).toBe('123.45');
    });
  });

  describe('Event Handlers', () => {
    it('should call onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Input onClick={handleClick} data-testid="input" />);

      await user.click(screen.getByTestId('input'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown handler', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      render(<Input onKeyDown={handleKeyDown} data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();
      await user.keyboard('a');

      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should call onKeyUp handler', async () => {
      const handleKeyUp = jest.fn();
      const user = userEvent.setup();
      render(<Input onKeyUp={handleKeyUp} data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();
      await user.keyboard('a');

      expect(handleKeyUp).toHaveBeenCalled();
    });

    it('should call onKeyPress handler', async () => {
      const handleKeyPress = jest.fn();
      const user = userEvent.setup();
      render(<Input onKeyPress={handleKeyPress} data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();
      await user.keyboard('a');

      // Note: onKeyPress is deprecated but should still work
      expect(handleKeyPress).toHaveBeenCalled();
    });
  });

  describe('Selection Styles', () => {
    it('should apply selection styles', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('selection:bg-primary', 'selection:text-primary-foreground');
    });
  });

  describe('Outline and Transition', () => {
    it('should have no outline by default', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('outline-none');
    });

    it('should apply transition classes', () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('transition-[color,box-shadow]');
    });
  });
});
