export const codeFonts = {
  cascadia: { label: "Cascadia Code", family: '"Cascadia Code", monospace' },
  jetbrains: { label: "JetBrains Mono", family: '"JetBrains Mono", monospace' },
  fira: { label: "Fira Code", family: '"Fira Code", monospace' },
  system: {
    label: "系统等宽字体",
    family: 'ui-monospace, "Cascadia Mono", Consolas, "Liberation Mono", monospace',
  },
} as const;

export type CodeFont = keyof typeof codeFonts;
export const defaultCodeFont: CodeFont = "cascadia";
export const cleanCodeFont = (value: unknown): CodeFont =>
  typeof value === "string" && Object.hasOwn(codeFonts, value)
    ? (value as CodeFont)
    : defaultCodeFont;
