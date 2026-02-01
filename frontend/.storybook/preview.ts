import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f9fafb',
        },
        {
          name: 'dark',
          value: '#111827',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Apply dark class to body when dark theme is selected
      const isDark = context.globals.theme === 'dark';

      if (typeof document !== 'undefined') {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      return (
        <div className={isDark ? 'dark' : ''}>
          <div className="bg-gray-50 dark:bg-gray-900 p-8 min-h-screen">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
