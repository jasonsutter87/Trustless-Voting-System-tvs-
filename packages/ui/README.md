# @tvs/ui

Shared UI component library for TVS (Trustless Voting System) applications.

## Overview

This package provides a centralized UI component library built on [shadcn/ui](https://ui.shadcn.com/) that can be shared across the admin portal and voter applications. It uses:

- **shadcn/ui** - High-quality, accessible components
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - Type-safe variant styling
- **Lucide React** - Icon library

## Installation

This package is part of the TVS monorepo workspace. It's automatically available to other packages via pnpm workspaces:

```json
{
  "dependencies": {
    "@tvs/ui": "workspace:*"
  }
}
```

## Usage

```tsx
import { cn } from '@tvs/ui'

// Use the cn utility to merge Tailwind classes
const className = cn('base-class', 'additional-class', conditionalClass && 'conditional')
```

## Development

Components are initially created in `apps/admin/src/components/ui` using shadcn/ui CLI. When a component needs to be shared across multiple applications, it should be:

1. Moved to `packages/ui/src/components/`
2. Exported from `packages/ui/src/index.ts`
3. Updated in consuming apps to import from `@tvs/ui`

## Component Architecture

### Phase 1 (Current)
- Components live in `apps/admin/src/components/ui`
- Generated using shadcn/ui CLI
- Used only by the admin application

### Phase 2 (Future)
- Commonly used components moved to `packages/ui/src/components`
- Exported via `@tvs/ui` package
- Shared by both admin and voter applications

## Adding New Components

Components are added to the admin app using shadcn/ui CLI:

```bash
cd apps/admin
npx shadcn@latest add [component-name]
```

Available components: https://ui.shadcn.com/docs/components

## License

AGPL-3.0
