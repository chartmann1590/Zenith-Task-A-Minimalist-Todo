# Usage

## Overview
React-based todo application with local state management.
- Frontend: React Router 6 + TypeScript + ShadCN UI
- State Management: Zustand for local state
- Shared: Types in `shared/types.ts`

## ⚠️ IMPORTANT: Demo Content
**The existing demo pages and mock data are FOR TEMPLATE UNDERSTANDING ONLY.**
- Replace `HomePage.tsx` with actual application pages
- Remove or replace mock data in `shared/mock-data.ts` with real data structures
- Implement actual business logic for task management

## Tech
- React Router 6, ShadCN UI, Tailwind, Lucide, TypeScript

## Development Restrictions
- **Tailwind Colors**: Hardcode custom colors in `tailwind.config.js`, NOT in `index.css`
- **Components**: Use existing ShadCN components instead of writing custom ones
- **Icons**: Import from `lucide-react` directly
- **Error Handling**: ErrorBoundary components are pre-implemented

## Styling
- Responsive, accessible
- Prefer ShadCN components; Tailwind for layout/spacing/typography
- Use framer-motion sparingly for micro-interactions

## Code Organization

### Frontend Structure
- `src/pages/HomePage.tsx` - Main application page
- `src/pages/SettingsPage.tsx` - Settings page for configuration
- `src/components/ThemeToggle.tsx` - Theme switching component
- `src/hooks/useTheme.ts` - Theme management hook
- `src/store/appStore.ts` - Zustand store for state management

### Shared
- `shared/types.ts` - Application data types
- `shared/mock-data.ts` - Demo-only; replace

## State Management

### Using Zustand Store
The application uses Zustand for state management. Access and update state through the store:
```ts
import { useAppStore } from '@/store/appStore';

// In a component
const projects = useAppStore((state) => state.projects);
const addProject = useAppStore((state) => state.addProject);
```

### Type Safety
- All types are defined in `shared/types.ts`
- Use TypeScript for type safety throughout the application

## Frontend
- Use Zustand store for state management
- Handle loading/errors with proper error boundaries
- Use shared types for consistency