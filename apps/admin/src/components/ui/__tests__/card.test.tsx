/**
 * Card Component Tests
 * Comprehensive tests for Card and all its sub-components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../card';
import { xssPayloads } from '@/__tests__/utils/test-utils';

describe('Card', () => {
  describe('Card - Basic Rendering', () => {
    it('should render card element', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-card', 'text-card-foreground', 'flex', 'flex-col', 'gap-6', 'rounded-xl', 'border', 'py-6', 'shadow-sm');
    });

    it('should render as a div element', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card').tagName).toBe('DIV');
    });

    it('should have data-slot attribute', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
    });
  });

  describe('Card - Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class', 'bg-card');
    });

    it('should allow multiple custom classes', () => {
      render(<Card className="class-1 class-2 class-3" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('should handle empty className', () => {
      render(<Card className="" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      render(<Card className={undefined} data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Card - Props Forwarding', () => {
    it('should forward id prop', () => {
      render(<Card id="test-id" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('id', 'test-id');
    });

    it('should forward aria-label prop', () => {
      render(<Card aria-label="Test card" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'Test card');
    });

    it('should forward role prop', () => {
      render(<Card role="region" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('role', 'region');
    });

    it('should forward data attributes', () => {
      render(<Card data-custom="value" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('data-custom', 'value');
    });

    it('should forward onClick handler', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick} data-testid="card">Content</Card>);
      screen.getByTestId('card').click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('CardHeader - Basic Rendering', () => {
    it('should render card header element', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('@container/card-header', 'grid', 'auto-rows-min', 'items-start', 'gap-2', 'px-6');
    });

    it('should have data-slot attribute', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header');
    });
  });

  describe('CardHeader - Custom ClassName', () => {
    it('should merge custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header', 'grid');
    });
  });

  describe('CardTitle - Basic Rendering', () => {
    it('should render card title element', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('leading-none', 'font-semibold');
    });

    it('should have data-slot attribute', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title');
    });
  });

  describe('CardDescription - Basic Rendering', () => {
    it('should render card description element', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId('desc')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<CardDescription>Card Description</CardDescription>);
      expect(screen.getByText('Card Description')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-muted-foreground', 'text-sm');
    });

    it('should have data-slot attribute', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description');
    });
  });

  describe('CardAction - Basic Rendering', () => {
    it('should render card action element', () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      expect(screen.getByTestId('action')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<CardAction>Action Button</CardAction>);
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      const action = screen.getByTestId('action');
      expect(action).toHaveClass('col-start-2', 'row-span-2', 'row-start-1', 'self-start', 'justify-self-end');
    });

    it('should have data-slot attribute', () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action');
    });
  });

  describe('CardContent - Basic Rendering', () => {
    it('should render card content element', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<CardContent>Main Content</CardContent>);
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('px-6');
    });

    it('should have data-slot attribute', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content');
    });
  });

  describe('CardFooter - Basic Rendering', () => {
    it('should render card footer element', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'px-6');
    });

    it('should have data-slot attribute', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer');
    });
  });

  describe('Complete Card Structure', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
            <CardDescription data-testid="desc">Description</CardDescription>
            <CardAction data-testid="action">Action</CardAction>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('desc')).toBeInTheDocument();
      expect(screen.getByTestId('action')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render card with only header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render card with nested components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span data-testid="nested">Nested Element</span>
            </CardTitle>
          </CardHeader>
        </Card>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });
  });

  describe('XSS Security', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely render XSS in Card: ${payload.substring(0, 30)}...`, () => {
        render(<Card>{payload}</Card>);
        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in CardTitle: ${payload.substring(0, 30)}...`, () => {
        render(<CardTitle>{payload}</CardTitle>);
        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in CardDescription: ${payload.substring(0, 30)}...`, () => {
        render(<CardDescription>{payload}</CardDescription>);
        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in CardContent: ${payload.substring(0, 30)}...`, () => {
        render(<CardContent>{payload}</CardContent>);
        expect(screen.getByText(payload)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty card', () => {
      render(<Card data-testid="card" />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      render(<Card>{longContent}</Card>);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle multiple CardContent sections', () => {
      render(
        <Card>
          <CardContent>Content 1</CardContent>
          <CardContent>Content 2</CardContent>
          <CardContent>Content 3</CardContent>
        </Card>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialChars = '!@#$%^&*()[]{}|\\:;"<>,.?/~`';
      render(<Card>{specialChars}</Card>);
      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 مرحبا العالم שלום עולם';
      render(<CardTitle>{unicode}</CardTitle>);
      expect(screen.getByText(unicode)).toBeInTheDocument();
    });

    it('should handle emojis', () => {
      const emojis = '🎉 🎊 🎈 🎁 🎀';
      render(<CardDescription>{emojis}</CardDescription>);
      expect(screen.getByText(emojis)).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      render(
        <Card>
          {null}
          <CardContent>Valid Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Valid Content')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <Card>
          {undefined}
          <CardContent>Valid Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Valid Content')).toBeInTheDocument();
    });

    it('should handle boolean children gracefully', () => {
      render(
        <Card>
          {false}
          {true}
          <CardContent>Valid Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Valid Content')).toBeInTheDocument();
    });

    it('should handle array of children', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      render(
        <CardContent>
          {items.map((item, i) => (
            <div key={i}>{item}</div>
          ))}
        </CardContent>
      );

      items.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should support aria-labelledby', () => {
      render(
        <Card aria-labelledby="card-title" data-testid="card">
          <CardTitle id="card-title">Accessible Title</CardTitle>
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveAttribute('aria-labelledby', 'card-title');
    });

    it('should support aria-describedby', () => {
      render(
        <Card aria-describedby="card-desc" data-testid="card">
          <CardDescription id="card-desc">Accessible Description</CardDescription>
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveAttribute('aria-describedby', 'card-desc');
    });

    it('should support custom role attribute', () => {
      render(<Card role="article" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('role', 'article');
    });

    it('should support aria-live', () => {
      render(<Card aria-live="polite" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Styling Flexibility', () => {
    it('should allow overriding background color', () => {
      render(<Card className="bg-red-500" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('bg-red-500');
    });

    it('should allow overriding padding', () => {
      render(<Card className="p-0" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('p-0');
    });

    it('should allow overriding border radius', () => {
      render(<Card className="rounded-none" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('rounded-none');
    });

    it('should allow adding custom styles to header', () => {
      render(<CardHeader className="bg-blue-500" data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId('header')).toHaveClass('bg-blue-500');
    });

    it('should allow adding custom styles to title', () => {
      render(<CardTitle className="text-2xl" data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveClass('text-2xl');
    });
  });
});
