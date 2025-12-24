# Shared UI Components

This directory will house shared UI components that are used across multiple TVS applications (admin portal, voter app, etc.).

## Component Migration Strategy

Components are created using shadcn/ui CLI in the individual apps first:

```bash
cd apps/admin
npx shadcn@latest add [component-name]
```

When a component needs to be shared:

1. **Copy** the component from `apps/admin/src/components/ui/[component].tsx` to this directory
2. **Update** the component to use the shared `@tvs/ui/lib/utils` path
3. **Export** the component from `packages/ui/src/index.ts`
4. **Update** consuming apps to import from `@tvs/ui` instead of local paths

## Available Components (Admin Only - Phase 1)

Currently installed in `apps/admin/src/components/ui/`:

### Basic Components
- `button.tsx` - Button with variants (default, destructive, outline, secondary, ghost, link)
- `badge.tsx` - Badge for status indicators
- `input.tsx` - Text input field
- `label.tsx` - Form label
- `card.tsx` - Card container with header, content, footer

### Form Components
- `form.tsx` - Form wrapper with React Hook Form integration
- `select.tsx` - Dropdown select
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio button group
- `textarea.tsx` - Multi-line text input
- `switch.tsx` - Toggle switch

### Navigation Components
- `dialog.tsx` - Modal dialog
- `dropdown-menu.tsx` - Dropdown menu
- `sheet.tsx` - Side sheet (mobile navigation)
- `tabs.tsx` - Tab navigation

### Data Display
- `table.tsx` - Table with header, body, footer

## Future Shared Components

As the project grows, we'll migrate commonly used components here:

- Custom form fields (e.g., DatePicker, TimePicker)
- Data visualization components
- Election-specific components
- Cryptographic verification components
- Voter authentication components
