import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    describe('basic functionality', () => {
      it('should merge single class name', () => {
        expect(cn('btn')).toBe('btn');
      });

      it('should merge multiple class names', () => {
        expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
      });

      it('should merge array of class names', () => {
        expect(cn(['btn', 'btn-primary'])).toBe('btn btn-primary');
      });

      it('should merge object with conditional classes', () => {
        expect(cn({ btn: true, 'btn-primary': true })).toBe('btn btn-primary');
      });

      it('should filter out false conditional classes', () => {
        expect(cn({ btn: true, 'btn-primary': false })).toBe('btn');
      });

      it('should merge mixed types (strings, arrays, objects)', () => {
        const result = cn('base', ['btn', 'btn-sm'], { active: true, disabled: false });
        expect(result).toBe('base btn btn-sm active');
      });
    });

    describe('tailwind merge functionality', () => {
      it('should handle conflicting tailwind classes by keeping last one', () => {
        expect(cn('p-2', 'p-4')).toBe('p-4');
      });

      it('should merge non-conflicting tailwind classes', () => {
        expect(cn('p-2', 'm-4')).toBe('p-2 m-4');
      });

      it('should handle responsive variants', () => {
        expect(cn('text-sm', 'md:text-lg')).toBe('text-sm md:text-lg');
      });

      it('should handle conflicting responsive variants', () => {
        expect(cn('md:text-sm', 'md:text-lg')).toBe('md:text-lg');
      });

      it('should handle hover states', () => {
        expect(cn('hover:bg-blue-500', 'hover:bg-red-500')).toBe('hover:bg-red-500');
      });

      it('should handle focus states', () => {
        expect(cn('focus:ring-2', 'focus:ring-4')).toBe('focus:ring-4');
      });

      it('should handle dark mode variants', () => {
        expect(cn('bg-white', 'dark:bg-black')).toBe('bg-white dark:bg-black');
      });

      it('should handle conflicting dark mode variants', () => {
        expect(cn('dark:bg-gray-800', 'dark:bg-black')).toBe('dark:bg-black');
      });

      it('should handle complex tailwind utility conflicts', () => {
        expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
      });

      it('should merge border utilities correctly', () => {
        expect(cn('border-2', 'border-4')).toBe('border-4');
      });

      it('should handle text color conflicts', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      });

      it('should handle background color conflicts', () => {
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
      });
    });

    describe('edge cases - null and undefined', () => {
      it('should handle null values', () => {
        expect(cn('btn', null)).toBe('btn');
      });

      it('should handle undefined values', () => {
        expect(cn('btn', undefined)).toBe('btn');
      });

      it('should handle multiple null values', () => {
        expect(cn(null, null, 'btn')).toBe('btn');
      });

      it('should handle multiple undefined values', () => {
        expect(cn(undefined, undefined, 'btn')).toBe('btn');
      });

      it('should handle mixed null and undefined', () => {
        expect(cn('btn', null, undefined, 'active')).toBe('btn active');
      });

      it('should handle all null values', () => {
        expect(cn(null, null)).toBe('');
      });

      it('should handle all undefined values', () => {
        expect(cn(undefined, undefined)).toBe('');
      });
    });

    describe('edge cases - empty values', () => {
      it('should handle empty string', () => {
        expect(cn('')).toBe('');
      });

      it('should handle multiple empty strings', () => {
        expect(cn('', '', 'btn')).toBe('btn');
      });

      it('should handle empty array', () => {
        expect(cn([])).toBe('');
      });

      it('should handle array with empty strings', () => {
        expect(cn(['', '', 'btn'])).toBe('btn');
      });

      it('should handle empty object', () => {
        expect(cn({})).toBe('');
      });

      it('should handle object with all false values', () => {
        expect(cn({ btn: false, active: false })).toBe('');
      });
    });

    describe('edge cases - whitespace', () => {
      it('should trim whitespace from class names', () => {
        expect(cn(' btn ')).toBe('btn');
      });

      it('should handle multiple spaces between classes', () => {
        expect(cn('btn  primary')).toBe('btn primary');
      });

      it('should handle tabs and newlines', () => {
        expect(cn('btn\tprimary\nactive')).toBe('btn primary active');
      });
    });

    describe('complex real-world scenarios', () => {
      it('should handle button variant with states', () => {
        const isActive = true;
        const isDisabled = false;
        const result = cn(
          'rounded-lg px-4 py-2 font-semibold',
          'bg-blue-500 text-white',
          'hover:bg-blue-600 focus:ring-2 focus:ring-blue-300',
          {
            'bg-blue-700': isActive,
            'opacity-50 cursor-not-allowed': isDisabled,
          }
        );
        expect(result).toContain('rounded-lg');
        expect(result).toContain('px-4');
        expect(result).toContain('py-2');
        expect(result).toContain('bg-blue-700'); // overrides bg-blue-500
        expect(result).not.toContain('opacity-50');
      });

      it('should handle card with responsive padding', () => {
        const result = cn(
          'bg-white rounded-lg shadow-md',
          'p-4 md:p-6 lg:p-8',
          'border border-gray-200'
        );
        expect(result).toBe('bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8 border border-gray-200');
      });

      it('should handle input states', () => {
        const hasError = true;
        const isFocused = false;
        const result = cn(
          'w-full px-3 py-2 border rounded-md',
          'focus:outline-none focus:ring-2',
          {
            'border-red-500 focus:ring-red-300': hasError,
            'border-blue-500 focus:ring-blue-300': !hasError,
            'ring-2': isFocused,
          }
        );
        expect(result).toContain('border-red-500');
        expect(result).toContain('focus:ring-red-300');
      });

      it('should handle grid layout classes', () => {
        const result = cn(
          'grid grid-cols-1',
          'md:grid-cols-2',
          'lg:grid-cols-3',
          'gap-4 md:gap-6'
        );
        expect(result).toBe('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6');
      });

      it('should handle text styles with variants', () => {
        const isPrimary = true;
        const result = cn(
          'text-base font-medium',
          {
            'text-blue-600': isPrimary,
            'text-gray-600': !isPrimary,
          },
          'hover:underline'
        );
        expect(result).toContain('text-blue-600');
        expect(result).not.toContain('text-gray-600');
      });
    });

    describe('no arguments', () => {
      it('should return empty string when called with no arguments', () => {
        expect(cn()).toBe('');
      });
    });

    describe('type safety edge cases', () => {
      it('should handle boolean true', () => {
        expect(cn('btn', true)).toBe('btn');
      });

      it('should handle boolean false', () => {
        expect(cn('btn', false)).toBe('btn');
      });

      it('should handle number 0', () => {
        expect(cn('btn', 0)).toBe('btn');
      });

      it('should handle number 1', () => {
        // clsx includes truthy numbers in the output
        expect(cn('btn', 1)).toBe('btn 1');
      });
    });
  });
});
