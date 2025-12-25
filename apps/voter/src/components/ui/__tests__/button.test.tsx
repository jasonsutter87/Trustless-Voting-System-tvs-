import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'
import Link from 'next/link'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders as button element by default', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('renders with data-slot attribute', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-slot', 'button')
    })

    it('renders children correctly', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'default')
      expect(button).toHaveClass('bg-primary')
    })

    it('renders destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'destructive')
      expect(button).toHaveClass('bg-destructive')
    })

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'outline')
      expect(button).toHaveClass('border')
    })

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'secondary')
      expect(button).toHaveClass('bg-secondary')
    })

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'ghost')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('renders link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'link')
      expect(button).toHaveClass('underline-offset-4')
    })

    it('applies default variant when no variant specified', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'default')
    })
  })

  describe('Sizes', () => {
    it('renders default size', () => {
      render(<Button size="default">Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'default')
      expect(button).toHaveClass('h-9')
    })

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'sm')
      expect(button).toHaveClass('h-8')
    })

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'lg')
      expect(button).toHaveClass('h-10')
    })

    it('renders icon size', () => {
      render(<Button size="icon" aria-label="Icon button">I</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'icon')
      expect(button).toHaveClass('size-9')
    })

    it('renders icon-sm size', () => {
      render(<Button size="icon-sm" aria-label="Small icon">S</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'icon-sm')
      expect(button).toHaveClass('size-8')
    })

    it('renders icon-lg size', () => {
      render(<Button size="icon-lg" aria-label="Large icon">L</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'icon-lg')
      expect(button).toHaveClass('size-10')
    })

    it('applies default size when no size specified', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'default')
    })
  })

  describe('States', () => {
    it('renders enabled button by default', () => {
      render(<Button>Enabled</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })

    it('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:pointer-events-none')
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('supports aria-disabled attribute', () => {
      render(<Button aria-disabled="true">Aria Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('applies aria-invalid styles', () => {
      render(<Button aria-invalid="true">Invalid</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('aria-invalid:ring-destructive/20')
      expect(button).toHaveClass('aria-invalid:border-destructive')
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      render(<Button onClick={handleClick}>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('handles multiple clicks', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      render(<Button onClick={handleClick}>Click</Button>)

      const button = screen.getByRole('button')
      await user.click(button)
      await user.click(button)
      await user.click(button)
      expect(handleClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('asChild prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <Link href="/test">Link Button</Link>
        </Button>
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })

    it('applies button classes to child component', () => {
      render(
        <Button asChild variant="destructive">
          <Link href="/delete">Delete</Link>
        </Button>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('bg-destructive')
    })

    it('renders as button when asChild is false', () => {
      render(<Button asChild={false}>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('merges custom className with base classes', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('inline-flex')
    })

    it('allows custom className to override styles', () => {
      render(<Button className="h-20">Tall Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-20')
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      render(<Button onClick={handleClick}>Accessible</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      const button = screen.getByRole('button', { name: /close dialog/i })
      expect(button).toBeInTheDocument()
    })

    it('applies focus-visible styles', () => {
      render(<Button>Focus</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:border-ring')
      expect(button).toHaveClass('focus-visible:ring-ring/50')
    })

    it('has outline-none for custom focus styling', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('outline-none')
    })
  })

  describe('Variant and Size Combinations', () => {
    it('renders destructive small button', () => {
      render(<Button variant="destructive" size="sm">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
      expect(button).toHaveClass('h-8')
    })

    it('renders outline large button', () => {
      render(<Button variant="outline" size="lg">Outline Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border')
      expect(button).toHaveClass('h-10')
    })

    it('renders ghost icon button', () => {
      render(<Button variant="ghost" size="icon" aria-label="Menu">☰</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
      expect(button).toHaveClass('size-9')
    })
  })

  describe('HTML Attributes', () => {
    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('supports name attribute', () => {
      render(<Button name="action">Action</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('name', 'action')
    })

    it('supports value attribute', () => {
      render(<Button value="confirm">Confirm</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('value', 'confirm')
    })

    it('supports form attribute', () => {
      render(<Button form="my-form">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('form', 'my-form')
    })

    it('supports data attributes', () => {
      render(<Button data-testid="custom-button" data-action="save">Save</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
      expect(button).toHaveAttribute('data-action', 'save')
    })
  })
})
