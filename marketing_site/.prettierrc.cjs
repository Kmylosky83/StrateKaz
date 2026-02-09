module.exports = {
  // Semicolons - Use semicolons for consistency with TypeScript
  semi: true,

  // Trailing commas - ES5 style for better git diffs
  trailingComma: 'es5',

  // Quotes - Single quotes for consistency with modern JS practices
  singleQuote: true,

  // Line width - 80 characters for better readability
  printWidth: 80,

  // Indentation - 2 spaces for React/TypeScript projects
  tabWidth: 2,
  useTabs: false,

  // JSX quotes - Single quotes to match JS
  jsxSingleQuote: true,

  // Bracket spacing - No spaces for cleaner look
  bracketSpacing: true,

  // Bracket line - Keep JSX closing bracket on same line
  bracketSameLine: false,

  // Arrow function parentheses - Avoid when possible
  arrowParens: 'avoid',

  // Prose wrap - Preserve for markdown files
  proseWrap: 'preserve',

  // HTML whitespace sensitivity - CSS display property
  htmlWhitespaceSensitivity: 'css',

  // Vue files - Script and style tag indentation
  vueIndentScriptAndStyle: false,

  // End of line - LF for cross-platform compatibility
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line - false for better HTML readability
  singleAttributePerLine: false,

  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
  ],
};
