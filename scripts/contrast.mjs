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
const pairs = [
['dark ink on surface','#EEF1F6','#161E2D',7],
['dark secondary on surface','#A6B2C7','#161E2D',4.5],
['dark proof on surface','#8FB4FF','#161E2D',4.5],
['highlight text','#14180A','#F2FF5C',7],
['dark change','#FF7A59','#161E2D',4.5],
['dark confirmed','#5EE6B8','#161E2D',4.5],
['light secondary','#545D6E','#ECE9DF',4.5],
['light proof','#2F5BD3','#FFFFFF',4.5],
['light change','#BA351B','#FFFFFF',4.5],
['light confirmed','#08694D','#FFFFFF',4.5],
['light highlight text','#14180A','#EEFF3A',7],
];
let failed = 0;
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${name.padEnd(38)} ${r.toFixed(2)}:1  target ${min}  ${ok ? 'pass' : 'FAIL'}`);
}
process.exit(failed ? 1 : 0);
