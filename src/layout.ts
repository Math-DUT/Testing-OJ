export const defaultLayout = {
  sidebar: 224,
  statement: 50,
  code: 62,
  input: 50,
  mobileStatement: 440,
  editorEnabled: true,
};
export type WorkspaceLayout = typeof defaultLayout;
export const layoutLimits = {
  sidebar: [180, 440],
  statement: [20, 80],
  code: [20, 80],
  input: [20, 80],
  mobileStatement: [200, 900],
} as const;
export function cleanLayout(
  value: Partial<WorkspaceLayout> | null,
): WorkspaceLayout {
  const result = { ...defaultLayout };
  for (const key of Object.keys(
    layoutLimits,
  ) as (keyof typeof layoutLimits)[]) {
    const n = Number(value?.[key]);
    if (value?.[key] != null && Number.isFinite(n)) {
      result[key] = Math.max(
        layoutLimits[key][0],
        Math.min(layoutLimits[key][1], n),
      );
    }
  }
  result.editorEnabled =
    typeof value?.editorEnabled === "boolean" ? value.editorEnabled : true;
  return result;
}
