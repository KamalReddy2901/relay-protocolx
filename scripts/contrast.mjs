// WCAG contrast ratios for the DESIGN.md colour pairs. Run: node scripts/contrast.mjs
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const PAPER = '#F6F3EC';
const SHEET = '#FFFDF8';
const pairs = [
  ['ink on paper', '#1B1A17', PAPER, 7],
  ['ink on sheet', '#1B1A17', SHEET, 7],
  ['ink-2 on paper', '#55514A', PAPER, 4.5],
  ['ink-2 on sheet', '#55514A', SHEET, 4.5],
  ['rule-strong on sheet (non-text UI)', '#8F887C', SHEET, 3],
  ['revise on sheet', '#9A2F1F', SHEET, 4.5],
  ['revise on revise-wash', '#9A2F1F', '#F7E4DF', 4.5],
  ['current on sheet', '#1E5B45', SHEET, 4.5],
  ['current on current-wash', '#1E5B45', '#E1EEE7', 4.5],
  ['ink on current-wash', '#1B1A17', '#E1EEE7', 4.5],
  ['tentative on sheet', '#7A5410', SHEET, 4.5],
  ['tentative on tentative-wash', '#7A5410', '#F6EBD3', 4.5],
  ['ink-2 on tentative-wash', '#55514A', '#F6EBD3', 4.5],
  ['focus on paper (non-text UI)', '#1F4FD1', PAPER, 3],
  ['focus on sheet (non-text UI)', '#1F4FD1', SHEET, 3],
  ['sheet on ink button fill', '#FFFDF8', '#1B1A17', 7],
];
let failed = 0;
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${name.padEnd(38)} ${r.toFixed(2)}:1  target ${min}  ${ok ? 'pass' : 'FAIL'}`);
}
process.exit(failed ? 1 : 0);
