# Storybook Configuration

This directory contains the Storybook configuration for the Grasas y Huesos del Norte frontend application.

## What is Storybook?

Storybook is a development environment for UI components. It allows you to browse a component library, view the different states of each component, and interactively develop and test components in isolation.

## Configuration Files

- **main.ts**: Main Storybook configuration file
  - Defines story file locations
  - Configures addons
  - Sets up Vite integration
  - Configures path aliases to match the main app

- **preview.ts**: Preview configuration
  - Imports global styles (Tailwind CSS)
  - Configures theme switching (light/dark mode)
  - Sets up global decorators
  - Configures backgrounds and other parameters

## Installed Addons

- **@storybook/addon-essentials**: Essential Storybook addons including docs, controls, actions, and more
- **@storybook/addon-links**: Navigate between stories
- **@storybook/addon-interactions**: Test user interactions
- **@storybook/addon-a11y**: Accessibility testing
- **@storybook/addon-onboarding**: Interactive onboarding guide

## Running Storybook

```bash
# Start Storybook development server (runs on http://localhost:6006)
npm run storybook

# Build static Storybook for deployment
npm run build-storybook
```

## Writing Stories

Stories are located alongside their components with the `.stories.tsx` extension.

### Example Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

const meta = {
  title: 'Components/Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for component props
  },
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default prop values
  },
};
```

## Theme Support

The Storybook configuration includes full support for light and dark themes:

- Use the theme switcher in the toolbar to toggle between themes
- The decorator applies the `dark` class to match your application's theme behavior
- All Tailwind CSS dark mode classes work as expected

## Path Aliases

The `@` alias is configured to point to the `src` directory, matching the main application configuration:

```typescript
import { Button } from '@/components/common/Button';
```

## Best Practices

1. **Co-locate stories**: Keep `.stories.tsx` files next to their components
2. **Use autodocs**: Add the `autodocs` tag to generate documentation automatically
3. **Interactive examples**: Create multiple stories showing different states and use cases
4. **Accessibility**: Test components with the a11y addon
5. **Naming convention**: Use descriptive story names that clearly indicate the component state

## Directory Structure

```
src/
├── components/
│   └── common/
│       ├── Badge.tsx
│       ├── Badge.stories.tsx  ← Story file
│       ├── Button.tsx
│       └── ...
└── ...
```

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Vite Builder](https://storybook.js.org/docs/react/builders/vite)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Addons](https://storybook.js.org/docs/react/addons/introduction)
