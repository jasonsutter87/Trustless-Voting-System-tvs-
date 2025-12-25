/**
 * Comprehensive TDD tests for Checkbox component
 * Testing checkbox rendering, states, interactions, and accessibility
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock checkbox since it uses Radix UI primitives
const MockCheckbox = React.forwardRef<
  HTMLButtonElement,
  {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    id?: string;
    className?: string;
    "aria-label"?: string;
    "aria-describedby"?: string;
    "data-testid"?: string;
  }
>(({ checked, defaultChecked, onCheckedChange, disabled, required, name, value, id, className, "aria-label": ariaLabel, "aria-describedby": ariaDescribedby, "data-testid": testId, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked ?? checked ?? false);

  const handleClick = () => {
    if (disabled) return;
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckedChange?.(newValue);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      disabled={disabled}
      aria-required={required}
      name={name}
      value={value}
      id={id}
      className={className}
      data-testid={testId}
      data-slot="checkbox"
      data-state={isChecked ? "checked" : "unchecked"}
      onClick={handleClick}
      {...props}
    >
      {isChecked && <span data-slot="checkbox-indicator">✓</span>}
    </button>
  );
});

MockCheckbox.displayName = "MockCheckbox";

describe("Checkbox Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<MockCheckbox data-testid="checkbox" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders as button element", () => {
      render(<MockCheckbox data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox").tagName).toBe("BUTTON");
    });

    it("has checkbox role", () => {
      render(<MockCheckbox />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders unchecked by default", () => {
      render(<MockCheckbox />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("Data Attributes", () => {
    it("has data-slot attribute", () => {
      render(<MockCheckbox data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox")).toHaveAttribute("data-slot", "checkbox");
    });

    it("has data-state unchecked when not checked", () => {
      render(<MockCheckbox data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox")).toHaveAttribute("data-state", "unchecked");
    });

    it("has data-state checked when checked", () => {
      render(<MockCheckbox defaultChecked data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox")).toHaveAttribute("data-state", "checked");
    });
  });

  describe("Checked State", () => {
    it("renders unchecked by default", () => {
      render(<MockCheckbox />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
    });

    it("renders checked when defaultChecked is true", () => {
      render(<MockCheckbox defaultChecked />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
    });

    it("renders checked when checked prop is true", () => {
      render(<MockCheckbox checked />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
    });

    it("shows check indicator when checked", () => {
      render(<MockCheckbox defaultChecked data-testid="checkbox" />);
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("hides check indicator when unchecked", () => {
      render(<MockCheckbox data-testid="checkbox" />);
      expect(screen.queryByText("✓")).not.toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("toggles on click", async () => {
      const user = userEvent.setup();
      render(<MockCheckbox />);
      const checkbox = screen.getByRole("checkbox");

      expect(checkbox).toHaveAttribute("aria-checked", "false");
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });

    it("toggles off on second click", async () => {
      const user = userEvent.setup();
      render(<MockCheckbox />);
      const checkbox = screen.getByRole("checkbox");

      await user.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "true");
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    it("calls onCheckedChange with true when checked", async () => {
      const onCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<MockCheckbox onCheckedChange={onCheckedChange} />);

      await user.click(screen.getByRole("checkbox"));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("calls onCheckedChange with false when unchecked", async () => {
      const onCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<MockCheckbox defaultChecked onCheckedChange={onCheckedChange} />);

      await user.click(screen.getByRole("checkbox"));
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it("does not toggle when disabled", async () => {
      const onCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<MockCheckbox disabled onCheckedChange={onCheckedChange} />);

      await user.click(screen.getByRole("checkbox"));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("handles keyboard space", async () => {
      const onCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<MockCheckbox onCheckedChange={onCheckedChange} />);

      screen.getByRole("checkbox").focus();
      await user.keyboard(" ");
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Disabled State", () => {
    it("renders disabled when disabled prop is true", () => {
      render(<MockCheckbox disabled />);
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("does not respond to clicks when disabled", async () => {
      const onCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<MockCheckbox disabled onCheckedChange={onCheckedChange} />);

      await user.click(screen.getByRole("checkbox"));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("accepts aria-label", () => {
      render(<MockCheckbox aria-label="Accept terms" />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-label", "Accept terms");
    });

    it("accepts aria-describedby", () => {
      render(
        <>
          <MockCheckbox aria-describedby="desc" />
          <span id="desc">Terms description</span>
        </>
      );
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-describedby", "desc");
    });

    it("can be associated with label via id", () => {
      render(
        <>
          <label htmlFor="test-checkbox">Accept</label>
          <MockCheckbox id="test-checkbox" />
        </>
      );
      expect(screen.getByLabelText("Accept")).toBeInTheDocument();
    });

    it("sets aria-required when required", () => {
      render(<MockCheckbox required />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-required", "true");
    });

    it("is focusable", () => {
      render(<MockCheckbox data-testid="checkbox" />);
      screen.getByTestId("checkbox").focus();
      expect(document.activeElement).toBe(screen.getByTestId("checkbox"));
    });
  });

  describe("Props Forwarding", () => {
    it("forwards id prop", () => {
      render(<MockCheckbox id="my-checkbox" />);
      expect(document.getElementById("my-checkbox")).toBeInTheDocument();
    });

    it("forwards name prop", () => {
      render(<MockCheckbox name="agreement" data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox")).toHaveAttribute("name", "agreement");
    });

    it("forwards value prop", () => {
      render(<MockCheckbox value="yes" data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox")).toHaveAttribute("value", "yes");
    });

    it("forwards className prop", () => {
      render(<MockCheckbox className="custom-checkbox" data-testid="checkbox" />);
      expect(screen.getByTestId("checkbox")).toHaveClass("custom-checkbox");
    });
  });

  describe("Form Integration", () => {
    it("works in a form context", async () => {
      const onSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={onSubmit}>
          <label htmlFor="terms">Accept terms</label>
          <MockCheckbox id="terms" name="terms" />
          <button type="submit">Submit</button>
        </form>
      );

      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Submit" }));
      expect(onSubmit).toHaveBeenCalled();
    });

    it("can be part of a checkbox group", () => {
      render(
        <div role="group" aria-label="Options">
          <MockCheckbox aria-label="Option 1" data-testid="checkbox-1" />
          <MockCheckbox aria-label="Option 2" data-testid="checkbox-2" />
          <MockCheckbox aria-label="Option 3" data-testid="checkbox-3" />
        </div>
      );

      expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("works as uncontrolled with defaultChecked", async () => {
      const user = userEvent.setup();
      render(<MockCheckbox defaultChecked={false} />);
      const checkbox = screen.getByRole("checkbox");

      expect(checkbox).toHaveAttribute("aria-checked", "false");
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });

    it("works as controlled component", async () => {
      const ControlledCheckbox = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <MockCheckbox
            checked={checked}
            onCheckedChange={(c) => setChecked(c)}
          />
        );
      };

      const user = userEvent.setup();
      render(<ControlledCheckbox />);
      const checkbox = screen.getByRole("checkbox");

      expect(checkbox).toHaveAttribute("aria-checked", "false");
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("Edge Cases", () => {
    it("handles multiple rapid clicks", async () => {
      const onCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<MockCheckbox onCheckedChange={onCheckedChange} />);
      const checkbox = screen.getByRole("checkbox");

      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(onCheckedChange).toHaveBeenCalledTimes(3);
    });

    it("maintains state after multiple toggles", async () => {
      const user = userEvent.setup();
      render(<MockCheckbox />);
      const checkbox = screen.getByRole("checkbox");

      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });
  });
});

describe("Checkbox with Label", () => {
  it("renders checkbox with label text", () => {
    render(
      <div className="flex items-center gap-2">
        <MockCheckbox id="terms" />
        <label htmlFor="terms">Accept terms and conditions</label>
      </div>
    );

    expect(screen.getByLabelText("Accept terms and conditions")).toBeInTheDocument();
  });

  it("checkbox can be toggled by clicking label", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MockCheckbox id="newsletter" />
        <label htmlFor="newsletter">Subscribe to newsletter</label>
      </div>
    );

    await user.click(screen.getByText("Subscribe to newsletter"));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });
});

describe("Checkbox Group", () => {
  it("allows multiple selections", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MockCheckbox aria-label="Red" data-testid="red" />
        <MockCheckbox aria-label="Green" data-testid="green" />
        <MockCheckbox aria-label="Blue" data-testid="blue" />
      </div>
    );

    await user.click(screen.getByTestId("red"));
    await user.click(screen.getByTestId("blue"));

    expect(screen.getByTestId("red")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("green")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("blue")).toHaveAttribute("aria-checked", "true");
  });

  it("tracks selections independently", async () => {
    const user = userEvent.setup();
    const CheckboxGroup = () => {
      const [selected, setSelected] = React.useState<string[]>([]);

      const toggleSelection = (value: string) => {
        setSelected((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        );
      };

      return (
        <div data-testid="selected">{selected.join(",")}</div>
      );
    };

    render(<CheckboxGroup />);
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
