import type { Locator, Page } from '@playwright/test';

type State = 'pending' | 'checking' | 'passed' | 'failed';
type Options = { target?: Locator; holdMs?: number };

/** One persistent checklist per page. Only a successful check earns a tick. */
export function createChecklist(page: Page, criteria: string[]) {
  const states: State[] = criteria.map(() => 'pending');

  async function show(title: string, options: Options = {}) {
    if (options.target) await options.target.scrollIntoViewIfNeeded();
    const box = options.target ? await options.target.boundingBox() : null;
    await page.evaluate(({ title, criteria, states, box }) => {
      let root = document.querySelector('[data-playwright-video-checkpoint]');
      if (!root) {
        root = document.createElement('div');
        root.setAttribute('data-playwright-video-checkpoint', '');
        root.setAttribute('aria-hidden', 'true');
        document.documentElement.append(root);
      }
      root.setAttribute('style', 'position:fixed;inset:0;pointer-events:none;z-index:2147483647');
      const panel = document.createElement('div');
      panel.style.cssText = [
        'position:absolute;top:20px;left:20px;max-width:calc(100vw - 80px)',
        'padding:14px 18px;border-radius:12px;background:#14213d;color:#ffffff',
        'font:16px/1.5 system-ui;box-shadow:0 4px 24px #0004',
      ].join(';');
      const heading = document.createElement('strong');
      heading.textContent = title;
      panel.append(heading);
      const list = document.createElement('ul');
      list.style.cssText = 'list-style:none;margin:8px 0 0;padding:0';
      const labels = { pending: '○', checking: '→ Checking:', passed: '✓ Passed:', failed: '✕ Failed:' };
      const colors = { pending: '#cbd5e1', checking: '#ffe08a', passed: '#8ff0ce', failed: '#ffabab' };
      criteria.forEach((criterion, index) => {
        const item = document.createElement('li');
        item.dataset.criterion = String(index);
        item.dataset.state = states[index];
        item.textContent = `${labels[states[index]]} ${criterion}`;
        item.style.cssText = `color:${colors[states[index]]};font-weight:${states[index] === 'pending' ? 400 : 700}`;
        list.append(item);
      });
      panel.append(list);
      const children: HTMLElement[] = [panel];
      if (box) {
        const highlight = document.createElement('div');
        highlight.style.cssText = [
          'position:absolute;outline:4px solid #d946ef;outline-offset:5px',
          `left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px`,
        ].join(';');
        children.push(highlight);
      }
      // Replace in one browser task, without removing the persistent root.
      root.replaceChildren(...children);
    }, { title, criteria, states, box });
    if (options.holdMs) await page.waitForTimeout(options.holdMs);
  }

  async function check(index: number, assertion: () => Promise<void>, options: Options = {}) {
    if (!Number.isInteger(index) || index < 0 || index >= criteria.length) {
      throw new RangeError('Criterion index is outside the checklist');
    }
    states[index] = 'checking';
    await show(`Checking criterion ${index + 1}`, { ...options, holdMs: 800 });
    try {
      await assertion();
    } catch (error) {
      states[index] = 'failed';
      // Preserve the original assertion error even if the page has closed.
      await show(`Criterion ${index + 1} failed`, options).catch(() => {});
      throw error;
    }
    states[index] = 'passed';
    await show(`Criterion ${index + 1} passed`, { ...options, holdMs: options.holdMs ?? 1800 });
  }

  return { show, check };
}
