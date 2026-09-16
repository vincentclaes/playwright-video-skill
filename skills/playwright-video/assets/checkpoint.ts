import type { Locator, Page } from '@playwright/test';

/** Call after asserting the app state. The pause is for viewers, not readiness. */
export async function checkpoint(
  page: Page,
  title: string,
  options: {
    criteria?: string[];
    active?: number;
    target?: Locator;
    holdMs?: number;
  } = {},
) {
  if (options.target) await options.target.scrollIntoViewIfNeeded();
  const box = options.target ? await options.target.boundingBox() : null;
  const overlay = await page.evaluateHandle(({ title, criteria, active, box }) => {
    const root = document.createElement('div');
    root.setAttribute('data-playwright-video-checkpoint', '');
    root.setAttribute('aria-hidden', 'true');
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const panel = document.createElement('div');
    panel.style.cssText = [
      'position:absolute;left:20px;max-width:calc(100vw - 80px)',
      'padding:16px 20px;border-radius:12px;background:#14213d;color:#ffffff',
      'font:16px/1.5 system-ui;box-shadow:0 4px 24px #0004',
      box && box.y < window.innerHeight / 2 ? 'bottom:20px' : 'top:20px',
    ].join(';');
    const heading = document.createElement('strong');
    heading.textContent = title;
    panel.append(heading);
    const list = document.createElement('ol');
    list.style.cssText = 'margin:8px 0 0;padding-left:24px';
    criteria.forEach((text, index) => {
      const item = document.createElement('li');
      item.textContent = text;
      item.style.cssText = index === active
        ? 'color:#8ff0ce;font-weight:700'
        : 'color:#cbd5e1';
      list.append(item);
    });
    if (criteria.length) panel.append(list);
    root.append(panel);
    if (box) {
      const highlight = document.createElement('div');
      highlight.style.cssText = [
        'position:absolute;outline:4px solid #d946ef;outline-offset:5px',
        `left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px`,
      ].join(';');
      root.append(highlight);
    }
    document.documentElement.append(root);
    return root;
  }, { title, criteria: options.criteria ?? [], active: options.active, box });
  try {
    await page.waitForTimeout(options.holdMs ?? 1800);
  } finally {
    try {
      await overlay.evaluate(element => element.remove());
    } finally {
      await overlay.dispose();
    }
  }
}
