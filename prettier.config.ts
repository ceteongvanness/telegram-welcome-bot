module.exports = {
  // 基本格式化选项
  singleQuote: true,
  trailingComma: 'none',
  tabWidth: 2,
  semi: true,
  printWidth: 100,
  useTabs: false,
  endOfLine: 'lf',

  // 括号选项
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // TypeScript 特定选项
  parser: 'typescript',

  // 文件覆盖
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.yml',
      options: {
        parser: 'yaml',
        tabWidth: 2
      }
    },
    {
      files: '*.yaml',
      options: {
        parser: 'yaml',
        tabWidth: 2
      }
    }
  ]
};