import { launch, openAt, out } from './lib.mjs';

const b = await launch();
for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
  const { ctx, page } = await openAt(b, w, h);
  await page.screenshot({ path: out(`s1-${w}.png`) });
  const m = await page.evaluate(() => {
    const cs = (s) => {
      const c = getComputedStyle(document.querySelector(s));
      return { ff: c.fontFamily.slice(0, 36), fs: c.fontSize, bg: c.backgroundColor };
    };
    const btn = [...document.querySelectorAll('button')].find((x) => /Review/.test(x.textContent));
    const r = btn.getBoundingClientRect();
    return { body: cs('body'), h1: cs('h1'), ta: cs('textarea'), btnBottom: Math.round(r.bottom), vh: innerHeight, btnH: r.height, ariaDisabled: btn.getAttribute('aria-disabled'), scrollW: document.documentElement.scrollWidth };
  });
  console.log(w, JSON.stringify(m));
  await ctx.close();
}
await b.close();
