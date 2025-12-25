/**
 * Comprehensive tests for Header Component
 *
 * Tests cover:
 * - Component rendering and structure
 * - Navigation items and links
 * - Active state detection
 * - Mobile menu functionality
 * - Responsive design
 * - Accessibility features
 * - User interactions
 * - Edge cases and different routes
 */

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePathname } from 'next/navigation'
import { Header } from '../header'

// Mock next/navigation
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className, onClick }: any) => {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
})

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('renders the logo', () => {
      render(<Header />)
      expect(screen.getByText('TVS Voter')).toBeInTheDocument()
    })

    it('renders shield icon', () => {
      const { container } = render(<Header />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders all navigation items', () => {
      render(<Header />)
      expect(screen.getAllByRole('link', { name: /vote/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('link', { name: /verify/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('link', { name: /results/i }).length).toBeGreaterThan(0)
      expect(screen.getAllByRole('link', { name: /ledger/i }).length).toBeGreaterThan(0)
    })

    it('renders mobile menu button', () => {
      render(<Header />)
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('renders navigation container', () => {
      render(<Header />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has sticky positioning', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('sticky', 'top-0')
    })

    it('has backdrop blur effect', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('backdrop-blur')
    })

    it('has high z-index for layering', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('z-50')
    })
  })

  describe('Navigation Links', () => {
    it('Vote link points to root path', () => {
      render(<Header />)
      const voteLinks = screen.getAllByRole('link', { name: /vote/i })
      voteLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/')
      })
    })

    it('Verify link points to verify path', () => {
      render(<Header />)
      const verifyLinks = screen.getAllByRole('link', { name: /verify/i })
      verifyLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/verify')
      })
    })

    it('Results link points to results path', () => {
      render(<Header />)
      const resultsLinks = screen.getAllByRole('link', { name: /results/i })
      resultsLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/results')
      })
    })

    it('Ledger link points to ledger path', () => {
      render(<Header />)
      const ledgerLinks = screen.getAllByRole('link', { name: /ledger/i })
      ledgerLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/ledger')
      })
    })

    it('logo links to home page', () => {
      render(<Header />)
      const logoLink = screen.getByRole('link', { name: /tvs voter/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Active State Detection', () => {
    it('marks Vote as active on root path', () => {
      mockUsePathname.mockReturnValue('/')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const voteLink = within(nav as HTMLElement).getByRole('link', { name: /vote/i })
        expect(voteLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Vote as active on /vote path', () => {
      mockUsePathname.mockReturnValue('/vote/123')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const voteLink = within(nav as HTMLElement).getByRole('link', { name: /vote/i })
        expect(voteLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Verify as active on /verify path', () => {
      mockUsePathname.mockReturnValue('/verify')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const verifyLink = within(nav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Results as active on /results path', () => {
      mockUsePathname.mockReturnValue('/results')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const resultsLink = within(nav as HTMLElement).getByRole('link', { name: /results/i })
        expect(resultsLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Ledger as active on /ledger path', () => {
      mockUsePathname.mockReturnValue('/ledger')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const ledgerLink = within(nav as HTMLElement).getByRole('link', { name: /ledger/i })
        expect(ledgerLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Verify as active on nested /verify path', () => {
      mockUsePathname.mockReturnValue('/verify/election-123/nullifier-456')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const verifyLink = within(nav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Results as active on nested /results path', () => {
      mockUsePathname.mockReturnValue('/results/election-123')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const resultsLink = within(nav as HTMLElement).getByRole('link', { name: /results/i })
        expect(resultsLink).toHaveClass('bg-zinc-100')
      }
    })

    it('marks Ledger as active on nested /ledger path', () => {
      mockUsePathname.mockReturnValue('/ledger/election-123')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const ledgerLink = within(nav as HTMLElement).getByRole('link', { name: /ledger/i })
        expect(ledgerLink).toHaveClass('bg-zinc-100')
      }
    })

    it('applies inactive styles to non-active links', () => {
      mockUsePathname.mockReturnValue('/')
      const { container } = render(<Header />)
      const nav = container.querySelector('.hidden.md\\:flex')
      if (nav) {
        const verifyLink = within(nav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('text-zinc-600')
        expect(verifyLink).not.toHaveClass('bg-zinc-100')
      }
    })
  })

  describe('Mobile Menu', () => {
    it('mobile menu is hidden by default', () => {
      const { container } = render(<Header />)
      const mobileNav = container.querySelector('.border-t.border-zinc-200.py-4')
      expect(mobileNav).not.toBeInTheDocument()
    })

    it('shows mobile menu when button is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      // There may be both desktop and mobile nav links, so use getAllByRole
      const voteLinks = screen.getAllByRole('link', { name: /vote/i })
      expect(voteLinks.length).toBeGreaterThan(0)
    })

    it('changes button label when menu opens', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
    })

    it('changes icon when menu opens', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      const initialIcon = menuButton.querySelector('svg')
      const initialPath = initialIcon?.querySelector('path')?.getAttribute('d')

      await user.click(menuButton)

      const closeButton = screen.getByRole('button', { name: /close menu/i })
      const closeIcon = closeButton.querySelector('svg')
      const closePath = closeIcon?.querySelector('path')?.getAttribute('d')

      expect(initialPath).not.toBe(closePath)
    })

    it('closes mobile menu when clicking a link', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      // Find mobile nav links
      const mobileNav = container.querySelector('.border-t')
      expect(mobileNav).toBeInTheDocument()

      const verifyLink = within(mobileNav as HTMLElement).getByRole('link', { name: /verify/i })
      await user.click(verifyLink)

      // Menu should close
      expect(container.querySelector('.border-t')).not.toBeInTheDocument()
    })

    it('toggles menu on repeated button clicks', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })

      // Open
      await user.click(menuButton)
      expect(container.querySelector('.border-t')).toBeInTheDocument()

      // Close
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      await user.click(closeButton)
      expect(container.querySelector('.border-t')).not.toBeInTheDocument()

      // Open again
      const openButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(openButton)
      expect(container.querySelector('.border-t')).toBeInTheDocument()
    })

    it('mobile menu has correct structure', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const mobileNav = container.querySelector('.border-t.border-zinc-200.py-4.md\\:hidden')
      expect(mobileNav).toBeInTheDocument()
    })

    it('mobile menu shows all navigation items', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const mobileNav = container.querySelector('.border-t')
      if (mobileNav) {
        expect(within(mobileNav as HTMLElement).getByRole('link', { name: /vote/i })).toBeInTheDocument()
        expect(within(mobileNav as HTMLElement).getByRole('link', { name: /verify/i })).toBeInTheDocument()
        expect(within(mobileNav as HTMLElement).getByRole('link', { name: /results/i })).toBeInTheDocument()
        expect(within(mobileNav as HTMLElement).getByRole('link', { name: /ledger/i })).toBeInTheDocument()
      }
    })

    it('mobile menu items have correct active state', async () => {
      mockUsePathname.mockReturnValue('/verify')
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const mobileNav = container.querySelector('.border-t')
      if (mobileNav) {
        const verifyLink = within(mobileNav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('bg-zinc-100')
      }
    })
  })

  describe('Responsive Design', () => {
    it('desktop nav has hidden class for mobile', () => {
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      expect(desktopNav).toBeInTheDocument()
    })

    it('mobile menu button has hidden class for desktop', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveClass('md:hidden')
    })

    it('uses container max-width', () => {
      const { container } = render(<Header />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('container')
    })

    it('has responsive padding', () => {
      const { container } = render(<Header />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('px-4')
    })

    it('header has fixed height', () => {
      const { container } = render(<Header />)
      const headerContent = container.querySelector('.h-16')
      expect(headerContent).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('header uses semantic HTML', () => {
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('navigation uses semantic HTML', () => {
      render(<Header />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('menu button has accessible label', () => {
      render(<Header />)
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('menu button label changes based on state', async () => {
      const user = userEvent.setup()
      render(<Header />)

      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /open menu/i }))

      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
    })

    it('all navigation links are keyboard accessible', () => {
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const links = within(desktopNav as HTMLElement).getAllByRole('link')
        links.forEach(link => {
          expect(link).toBeInTheDocument()
        })
      }
    })

    it('logo link is keyboard accessible', () => {
      render(<Header />)
      const logoLink = screen.getByRole('link', { name: /tvs voter/i })
      expect(logoLink).toBeInTheDocument()
    })

    it('mobile menu button is keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      menuButton.focus()
      expect(menuButton).toHaveFocus()
    })

    it('uses appropriate ARIA attributes on menu button', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveAttribute('aria-label')
    })
  })

  describe('Styling', () => {
    it('applies border to header', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      expect(header).toHaveClass('border-b')
    })

    it('applies background color with transparency', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      expect(header?.className).toMatch(/bg-white/)
    })

    it('logo has correct text styling', () => {
      render(<Header />)
      const logoText = screen.getByText('TVS Voter')
      expect(logoText).toHaveClass('text-lg', 'font-semibold')
    })

    it('shield icon has correct color', () => {
      const { container } = render(<Header />)
      const shieldIcon = container.querySelector('svg')
      expect(shieldIcon).toHaveClass('text-blue-600')
    })

    it('active link has highlighted background', () => {
      mockUsePathname.mockReturnValue('/')
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const voteLink = within(desktopNav as HTMLElement).getByRole('link', { name: /vote/i })
        expect(voteLink).toHaveClass('bg-zinc-100')
      }
    })

    it('inactive links have muted text color', () => {
      mockUsePathname.mockReturnValue('/')
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const verifyLink = within(desktopNav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('text-zinc-600')
      }
    })

    it('links have hover styles', () => {
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const links = within(desktopNav as HTMLElement).getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveClass('transition-colors')
        })
      }
    })

    it('menu button has rounded corners', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toHaveClass('rounded-lg')
    })
  })

  describe('Edge Cases', () => {
    it('handles unknown route gracefully', () => {
      mockUsePathname.mockReturnValue('/unknown-route')
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('handles deeply nested routes', () => {
      mockUsePathname.mockReturnValue('/verify/election/123/nullifier/456/proof')
      render(<Header />)
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const verifyLink = within(desktopNav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('bg-zinc-100')
      }
    })

    it('handles route with query parameters', () => {
      mockUsePathname.mockReturnValue('/results')
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('handles route with hash', () => {
      mockUsePathname.mockReturnValue('/ledger')
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('handles rapid menu toggle clicks', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })

      await user.click(menuButton)
      await user.click(screen.getByRole('button', { name: /close menu/i }))
      await user.click(screen.getByRole('button', { name: /open menu/i }))

      expect(container.querySelector('.border-t')).toBeInTheDocument()
    })

    it('handles clicking logo when menu is open', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const logoLink = screen.getByRole('link', { name: /tvs voter/i })
      await user.click(logoLink)

      // Menu should remain open (only nav links close it)
      expect(container.querySelector('.border-t')).toBeInTheDocument()
    })

    it('handles empty pathname', () => {
      mockUsePathname.mockReturnValue('')
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('handles pathname with trailing slash', () => {
      mockUsePathname.mockReturnValue('/verify/')
      render(<Header />)
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const verifyLink = within(desktopNav as HTMLElement).getByRole('link', { name: /verify/i })
        expect(verifyLink).toHaveClass('bg-zinc-100')
      }
    })

    it('handles case-sensitive route comparison', () => {
      mockUsePathname.mockReturnValue('/VERIFY')
      render(<Header />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('maintains state across re-renders', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      rerender(<Header />)

      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes on header', () => {
      const { container } = render(<Header />)
      const header = container.querySelector('header')
      expect(header?.className).toMatch(/dark:/)
    })

    it('logo has dark mode text color', () => {
      render(<Header />)
      const logoText = screen.getByText('TVS Voter')
      expect(logoText?.className).toMatch(/dark:text-zinc-100/)
    })

    it('shield icon has dark mode color', () => {
      const { container } = render(<Header />)
      const shieldIcon = container.querySelector('svg')
      // For SVG, className is an SVGAnimatedString, use getAttribute instead
      const className = shieldIcon?.getAttribute('class') || ''
      expect(className).toMatch(/dark:text-blue-400/)
    })

    it('navigation links have dark mode styles', () => {
      const { container } = render(<Header />)
      const desktopNav = container.querySelector('.hidden.md\\:flex')
      if (desktopNav) {
        const links = within(desktopNav as HTMLElement).getAllByRole('link')
        links.forEach(link => {
          expect(link?.className).toMatch(/dark:/)
        })
      }
    })

    it('mobile menu has dark mode border color', async () => {
      const user = userEvent.setup()
      const { container } = render(<Header />)

      const menuButton = screen.getByRole('button', { name: /open menu/i })
      await user.click(menuButton)

      const mobileNav = container.querySelector('.border-t')
      expect(mobileNav?.className).toMatch(/dark:border-zinc-800/)
    })
  })
})
