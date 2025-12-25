/**
 * Comprehensive TDD tests for Card components
 * Testing Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "../card";

describe("Card Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<Card>Content</Card>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<Card><span>Test Child</span></Card>);
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <Card>
          <span>First</span>
          <span>Second</span>
        </Card>
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });

    it("renders nested elements", () => {
      render(
        <Card>
          <div>
            <p>Nested content</p>
          </div>
        </Card>
      );
      expect(screen.getByText("Nested content")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
    });

    it("accepts custom data attributes", () => {
      render(<Card data-testid="card" data-custom="value">Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute("data-custom", "value");
    });
  });

  describe("Styling", () => {
    it("applies default classes", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("bg-card");
    });

    it("applies custom className", () => {
      render(<Card data-testid="card" className="custom-class">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("custom-class");
    });

    it("merges custom className with defaults", () => {
      render(<Card data-testid="card" className="my-custom">Content</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-card");
      expect(card).toHaveClass("my-custom");
    });

    it("has rounded corners", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("rounded-xl");
    });

    it("has border styling", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("border");
    });

    it("has shadow styling", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("shadow-sm");
    });

    it("uses flexbox layout", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("flex");
    });
  });

  describe("Accessibility", () => {
    it("renders as div element", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card").tagName).toBe("DIV");
    });

    it("accepts aria attributes", () => {
      render(<Card data-testid="card" aria-label="Card label">Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute("aria-label", "Card label");
    });

    it("accepts role attribute", () => {
      render(<Card data-testid="card" role="region">Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute("role", "region");
    });
  });

  describe("Props Forwarding", () => {
    it("forwards id prop", () => {
      render(<Card id="my-card">Content</Card>);
      expect(document.getElementById("my-card")).toBeInTheDocument();
    });

    it("forwards onClick handler", () => {
      const onClick = jest.fn();
      render(<Card data-testid="card" onClick={onClick}>Content</Card>);
      screen.getByTestId("card").click();
      expect(onClick).toHaveBeenCalled();
    });

    it("forwards tabIndex prop", () => {
      render(<Card data-testid="card" tabIndex={0}>Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute("tabindex", "0");
    });
  });
});

describe("CardHeader Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<CardHeader>Header</CardHeader>);
      expect(screen.getByText("Header")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<CardHeader><h2>Title</h2></CardHeader>);
      expect(screen.getByRole("heading")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "card-header");
    });
  });

  describe("Styling", () => {
    it("applies grid layout", () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId("header")).toHaveClass("grid");
    });

    it("applies custom className", () => {
      render(<CardHeader data-testid="header" className="custom">Header</CardHeader>);
      expect(screen.getByTestId("header")).toHaveClass("custom");
    });

    it("has padding", () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId("header")).toHaveClass("px-6");
    });
  });
});

describe("CardTitle Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<CardTitle><span>Custom Title</span></CardTitle>);
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId("title")).toHaveAttribute("data-slot", "card-title");
    });
  });

  describe("Styling", () => {
    it("has font-semibold", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId("title")).toHaveClass("font-semibold");
    });

    it("applies custom className", () => {
      render(<CardTitle data-testid="title" className="text-xl">Title</CardTitle>);
      expect(screen.getByTestId("title")).toHaveClass("text-xl");
    });
  });
});

describe("CardDescription Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<CardDescription>Detailed description text</CardDescription>);
      expect(screen.getByText("Detailed description text")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId("desc")).toHaveAttribute("data-slot", "card-description");
    });
  });

  describe("Styling", () => {
    it("has muted text color", () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId("desc")).toHaveClass("text-muted-foreground");
    });

    it("has small text size", () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId("desc")).toHaveClass("text-sm");
    });

    it("applies custom className", () => {
      render(<CardDescription data-testid="desc" className="italic">Description</CardDescription>);
      expect(screen.getByTestId("desc")).toHaveClass("italic");
    });
  });
});

describe("CardContent Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<CardContent><p>Paragraph content</p></CardContent>);
      expect(screen.getByText("Paragraph content")).toBeInTheDocument();
    });

    it("renders complex content", () => {
      render(
        <CardContent>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </CardContent>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "card-content");
    });
  });

  describe("Styling", () => {
    it("has horizontal padding", () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId("content")).toHaveClass("px-6");
    });

    it("applies custom className", () => {
      render(<CardContent data-testid="content" className="py-4">Content</CardContent>);
      expect(screen.getByTestId("content")).toHaveClass("py-4");
    });
  });
});

describe("CardFooter Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("renders button children", () => {
      render(
        <CardFooter>
          <button>Submit</button>
        </CardFooter>
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "card-footer");
    });
  });

  describe("Styling", () => {
    it("uses flexbox layout", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId("footer")).toHaveClass("flex");
    });

    it("has horizontal padding", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId("footer")).toHaveClass("px-6");
    });

    it("applies custom className", () => {
      render(<CardFooter data-testid="footer" className="justify-end">Footer</CardFooter>);
      expect(screen.getByTestId("footer")).toHaveClass("justify-end");
    });
  });
});

describe("CardAction Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<CardAction>Action</CardAction>);
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("renders button children", () => {
      render(
        <CardAction>
          <button>Edit</button>
        </CardAction>
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "card-action");
    });
  });

  describe("Styling", () => {
    it("positions in grid column 2", () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      expect(screen.getByTestId("action")).toHaveClass("col-start-2");
    });

    it("spans 2 rows", () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      expect(screen.getByTestId("action")).toHaveClass("row-span-2");
    });

    it("applies custom className", () => {
      render(<CardAction data-testid="action" className="text-right">Action</CardAction>);
      expect(screen.getByTestId("action")).toHaveClass("text-right");
    });
  });
});

describe("Card Composition", () => {
  it("renders full card structure", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
        <CardFooter>
          <button>Submit</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders card with action", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardAction>
            <button>Edit</button>
          </CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("renders multiple cards", () => {
    render(
      <div>
        <Card data-testid="card-1">
          <CardContent>Card 1</CardContent>
        </Card>
        <Card data-testid="card-2">
          <CardContent>Card 2</CardContent>
        </Card>
      </div>
    );

    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Card 2")).toBeInTheDocument();
  });
});

describe("Card Edge Cases", () => {
  it("handles empty card", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("handles null children", () => {
    render(<Card data-testid="card">{null}</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("handles undefined children", () => {
    render(<Card data-testid="card">{undefined}</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("handles conditional rendering", () => {
    const showContent = true;
    render(
      <Card data-testid="card">
        {showContent && <CardContent>Visible</CardContent>}
      </Card>
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("handles dynamic content", () => {
    const items = ["a", "b", "c"];
    render(
      <Card>
        <CardContent>
          {items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </CardContent>
      </Card>
    );
    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });
});
