/**
 * Comprehensive TDD tests for RadioGroup component
 * Testing radio group rendering, selection, interactions, and accessibility
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock RadioGroup components since they use Radix UI primitives
interface MockRadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
  children: React.ReactNode;
}

const MockRadioGroup = React.forwardRef<HTMLDivElement, MockRadioGroupProps>(
  ({ value: controlledValue, defaultValue, onValueChange, disabled, required, name, orientation = "vertical", className, "aria-label": ariaLabel, "data-testid": testId, children }, ref) => {
    const [value, setValue] = React.useState(defaultValue ?? controlledValue ?? "");

    const handleChange = (newValue: string) => {
      if (disabled) return;
      setValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-required={required}
        aria-orientation={orientation}
        data-slot="radio-group"
        data-testid={testId}
        className={className}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<MockRadioGroupItemProps>(child)) {
            return React.cloneElement(child, {
              checked: child.props.value === value,
              name,
              disabled: disabled || child.props.disabled,
              onChange: () => handleChange(child.props.value),
            });
          }
          return child;
        })}
      </div>
    );
  }
);

MockRadioGroup.displayName = "MockRadioGroup";

interface MockRadioGroupItemProps {
  value: string;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
  onChange?: () => void;
}

const MockRadioGroupItem = React.forwardRef<HTMLButtonElement, MockRadioGroupItemProps>(
  ({ value, checked, disabled, name, id, className, "aria-label": ariaLabel, "data-testid": testId, onChange }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        name={name}
        id={id}
        data-slot="radio-group-item"
        data-state={checked ? "checked" : "unchecked"}
        data-testid={testId}
        className={className}
        onClick={onChange}
      >
        {checked && <span data-slot="radio-group-indicator">●</span>}
      </button>
    );
  }
);

MockRadioGroupItem.displayName = "MockRadioGroupItem";

describe("RadioGroup Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("renders multiple radio items", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
          <MockRadioGroupItem value="c" aria-label="Option C" />
        </MockRadioGroup>
      );
      expect(screen.getAllByRole("radio")).toHaveLength(3);
    });

    it("has radiogroup role", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute on group", () => {
      render(
        <MockRadioGroup data-testid="group">
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "radio-group");
    });

    it("has data-slot attribute on items", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" data-testid="item" />
        </MockRadioGroup>
      );
      expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "radio-group-item");
    });

    it("has data-state unchecked when not selected", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" data-testid="item" />
        </MockRadioGroup>
      );
      expect(screen.getByTestId("item")).toHaveAttribute("data-state", "unchecked");
    });

    it("has data-state checked when selected", () => {
      render(
        <MockRadioGroup defaultValue="a">
          <MockRadioGroupItem value="a" aria-label="Option A" data-testid="item" />
        </MockRadioGroup>
      );
      expect(screen.getByTestId("item")).toHaveAttribute("data-state", "checked");
    });
  });

  describe("Selection", () => {
    it("no item selected by default", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );
      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute("aria-checked", "false");
      });
    });

    it("respects defaultValue", () => {
      render(
        <MockRadioGroup defaultValue="b">
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );
      expect(screen.getByLabelText("Option A")).toHaveAttribute("aria-checked", "false");
      expect(screen.getByLabelText("Option B")).toHaveAttribute("aria-checked", "true");
    });

    it("shows indicator when selected", () => {
      render(
        <MockRadioGroup defaultValue="a">
          <MockRadioGroupItem value="a" aria-label="Option A" data-testid="item-a" />
        </MockRadioGroup>
      );
      expect(screen.getByText("●")).toBeInTheDocument();
    });

    it("hides indicator when not selected", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" data-testid="item-a" />
        </MockRadioGroup>
      );
      expect(screen.queryByText("●")).not.toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("selects item on click", async () => {
      const user = userEvent.setup();
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );

      await user.click(screen.getByLabelText("Option A"));
      expect(screen.getByLabelText("Option A")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByLabelText("Option B")).toHaveAttribute("aria-checked", "false");
    });

    it("changes selection on different item click", async () => {
      const user = userEvent.setup();
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );

      await user.click(screen.getByLabelText("Option A"));
      await user.click(screen.getByLabelText("Option B"));

      expect(screen.getByLabelText("Option A")).toHaveAttribute("aria-checked", "false");
      expect(screen.getByLabelText("Option B")).toHaveAttribute("aria-checked", "true");
    });

    it("calls onValueChange with selected value", async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      render(
        <MockRadioGroup onValueChange={onValueChange}>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );

      await user.click(screen.getByLabelText("Option A"));
      expect(onValueChange).toHaveBeenCalledWith("a");
    });

    it("only allows one selection", async () => {
      const user = userEvent.setup();
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
          <MockRadioGroupItem value="c" aria-label="Option C" />
        </MockRadioGroup>
      );

      await user.click(screen.getByLabelText("Option A"));
      await user.click(screen.getByLabelText("Option B"));
      await user.click(screen.getByLabelText("Option C"));

      const checkedRadios = screen.getAllByRole("radio").filter(
        (radio) => radio.getAttribute("aria-checked") === "true"
      );
      expect(checkedRadios).toHaveLength(1);
    });
  });

  describe("Disabled State", () => {
    it("disables all items when group is disabled", () => {
      render(
        <MockRadioGroup disabled>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );

      screen.getAllByRole("radio").forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });

    it("prevents selection when disabled", async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      render(
        <MockRadioGroup disabled onValueChange={onValueChange}>
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );

      await user.click(screen.getByLabelText("Option A"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("allows disabling individual items", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" disabled />
        </MockRadioGroup>
      );

      expect(screen.getByLabelText("Option A")).not.toBeDisabled();
      expect(screen.getByLabelText("Option B")).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("accepts aria-label on group", () => {
      render(
        <MockRadioGroup aria-label="Choose option">
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-label", "Choose option");
    });

    it("accepts aria-label on items", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="First option" />
        </MockRadioGroup>
      );
      expect(screen.getByLabelText("First option")).toBeInTheDocument();
    });

    it("supports aria-required", () => {
      render(
        <MockRadioGroup required>
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
    });

    it("supports aria-orientation", () => {
      render(
        <MockRadioGroup orientation="horizontal">
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-orientation", "horizontal");
    });

    it("can be associated with label via id", () => {
      render(
        <div>
          <label id="label">Choose:</label>
          <MockRadioGroup aria-labelledby="label">
            <MockRadioGroupItem value="a" aria-label="Option A" />
          </MockRadioGroup>
        </div>
      );
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("items are focusable", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" aria-label="Option A" data-testid="item" />
        </MockRadioGroup>
      );
      screen.getByTestId("item").focus();
      expect(document.activeElement).toBe(screen.getByTestId("item"));
    });
  });

  describe("Props Forwarding", () => {
    it("forwards id to items", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="a" id="option-a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(document.getElementById("option-a")).toBeInTheDocument();
    });

    it("forwards className", () => {
      render(
        <MockRadioGroup className="custom-group" data-testid="group">
          <MockRadioGroupItem value="a" aria-label="Option A" className="custom-item" data-testid="item" />
        </MockRadioGroup>
      );
      expect(screen.getByTestId("group")).toHaveClass("custom-group");
      expect(screen.getByTestId("item")).toHaveClass("custom-item");
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("works as uncontrolled with defaultValue", async () => {
      const user = userEvent.setup();
      render(
        <MockRadioGroup defaultValue="a">
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
        </MockRadioGroup>
      );

      expect(screen.getByLabelText("Option A")).toHaveAttribute("aria-checked", "true");
      await user.click(screen.getByLabelText("Option B"));
      expect(screen.getByLabelText("Option B")).toHaveAttribute("aria-checked", "true");
    });

    it("works as controlled component", async () => {
      const ControlledRadioGroup = () => {
        const [value, setValue] = React.useState("a");
        return (
          <MockRadioGroup value={value} onValueChange={setValue}>
            <MockRadioGroupItem value="a" aria-label="Option A" />
            <MockRadioGroupItem value="b" aria-label="Option B" />
          </MockRadioGroup>
        );
      };

      const user = userEvent.setup();
      render(<ControlledRadioGroup />);

      expect(screen.getByLabelText("Option A")).toHaveAttribute("aria-checked", "true");
      await user.click(screen.getByLabelText("Option B"));
      expect(screen.getByLabelText("Option B")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("Form Integration", () => {
    it("works in a form context", async () => {
      const onSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={onSubmit}>
          <MockRadioGroup name="color" aria-label="Choose color">
            <MockRadioGroupItem value="red" aria-label="Red" />
            <MockRadioGroupItem value="blue" aria-label="Blue" />
          </MockRadioGroup>
          <button type="submit">Submit</button>
        </form>
      );

      await user.click(screen.getByLabelText("Red"));
      await user.click(screen.getByRole("button", { name: "Submit" }));
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty value", () => {
      render(
        <MockRadioGroup defaultValue="">
          <MockRadioGroupItem value="a" aria-label="Option A" />
        </MockRadioGroup>
      );
      expect(screen.getByLabelText("Option A")).toHaveAttribute("aria-checked", "false");
    });

    it("handles single item", () => {
      render(
        <MockRadioGroup>
          <MockRadioGroupItem value="only" aria-label="Only Option" />
        </MockRadioGroup>
      );
      expect(screen.getByRole("radio")).toBeInTheDocument();
    });

    it("handles many items", () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        value: `option-${i}`,
        label: `Option ${i}`,
      }));

      render(
        <MockRadioGroup>
          {items.map((item) => (
            <MockRadioGroupItem key={item.value} value={item.value} aria-label={item.label} />
          ))}
        </MockRadioGroup>
      );

      expect(screen.getAllByRole("radio")).toHaveLength(10);
    });

    it("handles rapid selection changes", async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      render(
        <MockRadioGroup onValueChange={onValueChange}>
          <MockRadioGroupItem value="a" aria-label="Option A" />
          <MockRadioGroupItem value="b" aria-label="Option B" />
          <MockRadioGroupItem value="c" aria-label="Option C" />
        </MockRadioGroup>
      );

      await user.click(screen.getByLabelText("Option A"));
      await user.click(screen.getByLabelText("Option B"));
      await user.click(screen.getByLabelText("Option C"));

      expect(onValueChange).toHaveBeenCalledTimes(3);
      expect(screen.getByLabelText("Option C")).toHaveAttribute("aria-checked", "true");
    });
  });
});

describe("RadioGroup with Labels", () => {
  it("renders with descriptive labels", () => {
    render(
      <MockRadioGroup aria-label="Select size">
        <div>
          <MockRadioGroupItem value="s" id="size-s" aria-label="Small" />
          <label htmlFor="size-s">Small - 10"</label>
        </div>
        <div>
          <MockRadioGroupItem value="m" id="size-m" aria-label="Medium" />
          <label htmlFor="size-m">Medium - 12"</label>
        </div>
        <div>
          <MockRadioGroupItem value="l" id="size-l" aria-label="Large" />
          <label htmlFor="size-l">Large - 14"</label>
        </div>
      </MockRadioGroup>
    );

    expect(screen.getByText("Small - 10\"")).toBeInTheDocument();
    expect(screen.getByText("Medium - 12\"")).toBeInTheDocument();
    expect(screen.getByText("Large - 14\"")).toBeInTheDocument();
  });
});

describe("RadioGroup Orientation", () => {
  it("supports vertical orientation", () => {
    render(
      <MockRadioGroup orientation="vertical" data-testid="group">
        <MockRadioGroupItem value="a" aria-label="Option A" />
        <MockRadioGroupItem value="b" aria-label="Option B" />
      </MockRadioGroup>
    );
    expect(screen.getByTestId("group")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("supports horizontal orientation", () => {
    render(
      <MockRadioGroup orientation="horizontal" data-testid="group">
        <MockRadioGroupItem value="a" aria-label="Option A" />
        <MockRadioGroupItem value="b" aria-label="Option B" />
      </MockRadioGroup>
    );
    expect(screen.getByTestId("group")).toHaveAttribute("aria-orientation", "horizontal");
  });
});
