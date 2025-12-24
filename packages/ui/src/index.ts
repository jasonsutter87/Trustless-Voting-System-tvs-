/**
 * @tvs/ui - Shared UI component library for TVS applications
 *
 * This package provides a centralized UI component library built on shadcn/ui
 * that can be shared across admin and voter applications.
 *
 * Usage:
 * import { Button, Card, Input } from '@tvs/ui'
 */

// Re-export utility functions
export { cn } from './lib/utils'

// Component exports will be added here as shared components are created
// Example:
// export { Button } from './components/button'
// export { Card } from './components/card'

/**
 * Note: Initially, components live in apps/admin/src/components/ui.
 * As components are needed in multiple apps, they should be moved here
 * to the shared package and re-exported.
 */
