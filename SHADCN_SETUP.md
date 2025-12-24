# shadcn/ui Setup Summary

This document describes the shadcn/ui component library setup for the TVS Admin Portal.

## Overview

shadcn/ui has been successfully initialized in the TVS admin application with a comprehensive set of UI components. The setup uses:

- **Style**: New York (modern, clean design)
- **Base Color**: Neutral (grayscale palette)
- **CSS Variables**: Enabled (for easy theming)
- **Icon Library**: Lucide React
- **Tailwind CSS**: v4.x

## Installation Location

```
apps/admin/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts      # cn() utility function
│   └── app/
│       └── globals.css   # Theme CSS variables
└── components.json       # shadcn/ui configuration
```

## Installed Components

### Basic UI Components
- **Button** (`button.tsx`) - Multiple variants: default, destructive, outline, secondary, ghost, link
- **Badge** (`badge.tsx`) - Status indicators with variants
- **Card** (`card.tsx`) - Container with CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Input** (`input.tsx`) - Text input fields
- **Label** (`label.tsx`) - Form labels

### Form Components
- **Form** (`form.tsx`) - React Hook Form integration with Zod validation
- **Select** (`select.tsx`) - Dropdown select menus
- **Checkbox** (`checkbox.tsx`) - Checkbox inputs
- **Radio Group** (`radio-group.tsx`) - Radio button groups
- **Textarea** (`textarea.tsx`) - Multi-line text inputs
- **Switch** (`switch.tsx`) - Toggle switches

### Navigation Components
- **Dialog** (`dialog.tsx`) - Modal dialogs
- **Dropdown Menu** (`dropdown-menu.tsx`) - Dropdown menus
- **Sheet** (`sheet.tsx`) - Side sheets (ideal for mobile navigation)

### Data Display Components
- **Table** (`table.tsx`) - Data tables with TableHeader, TableBody, TableRow, TableCell
- **Tabs** (`tabs.tsx`) - Tab navigation

## Dependencies Added

The following packages were automatically installed:

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "react-hook-form": "^7.69.0",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.2.1"
  }
}
```

## Shared UI Package (@tvs/ui)

A shared UI package structure has been created for future use:

```
packages/ui/
├── src/
│   ├── components/       # Shared components (empty for now)
│   │   └── README.md     # Component migration guide
│   ├── lib/
│   │   └── utils.ts      # cn() utility function
│   └── index.ts          # Package exports
├── package.json
├── tsconfig.json
└── README.md
```

### Migration Strategy

Components are initially created in `apps/admin` using shadcn/ui CLI. When a component needs to be shared across multiple apps (admin + voter):

1. Copy from `apps/admin/src/components/ui/[component].tsx` to `packages/ui/src/components/`
2. Update imports to use `@tvs/ui/lib/utils`
3. Export from `packages/ui/src/index.ts`
4. Update consuming apps to import from `@tvs/ui`

## Usage Examples

### Basic Button

```tsx
import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  )
}
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Election Details</CardTitle>
        <CardDescription>Manage your election settings</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
    </Card>
  )
}
```

### Form with Validation

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  electionName: z.string().min(3, "Election name must be at least 3 characters"),
})

export function ElectionForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="electionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Election Name</FormLabel>
              <FormControl>
                <Input placeholder="Presidential Election 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Election</Button>
      </form>
    </Form>
  )
}
```

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Adding More Components

To add additional components:

```bash
cd apps/admin
npx shadcn@latest add [component-name]
```

Browse available components: https://ui.shadcn.com/docs/components

Popular components to consider:
- **toast** - Toast notifications
- **alert-dialog** - Confirmation dialogs
- **popover** - Popover menus
- **calendar** - Date picker
- **data-table** - Advanced sortable/filterable tables
- **command** - Command palette
- **avatar** - User avatars
- **separator** - Visual dividers
- **skeleton** - Loading skeletons

## Theme Customization

Theme colors are defined in `apps/admin/src/app/globals.css` using CSS variables. The setup includes:

- Light and dark mode support (`.dark` class)
- OKLCH color space for better color consistency
- Customizable border radius via `--radius` variable
- Semantic color tokens (primary, secondary, muted, accent, destructive)
- Chart colors (chart-1 through chart-5)
- Sidebar-specific colors

To customize:

1. Edit CSS variables in `globals.css`
2. Use the theme configurator: https://ui.shadcn.com/themes

## Utility Function

The `cn()` utility merges Tailwind classes intelligently:

```tsx
import { cn } from "@/lib/utils"

// Handles conflicts - later classes override earlier ones
const className = cn(
  "bg-red-500",
  "bg-blue-500"  // This wins
)

// Conditional classes
const className = cn(
  "base-class",
  isActive && "active-class",
  error && "error-class"
)
```

## Next Steps

1. **Build UI Pages** - Use the components to build admin portal pages
2. **Create Custom Components** - Build domain-specific components using these primitives
3. **Add More Components** - Install additional shadcn/ui components as needed
4. **Setup Voter App** - When ready, repeat the setup process for the voter application
5. **Migrate Shared Components** - Move commonly used components to `@tvs/ui` package

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
