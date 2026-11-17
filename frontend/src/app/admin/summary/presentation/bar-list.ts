import { Component, computed, input } from '@angular/core';

export interface BarItem {
  label: string;
  value: number;
}

/**
 * Horizontal bars with the number beside each one. The list itself is the text equivalent: the
 * bars are decoration and the figures are always visible.
 */
@Component({
  selector: 'app-bar-list',
  template: `
    <ul class="bars" [attr.aria-label]="label()">
      @for (item of rows(); track item.label) {
        <li>
          <span class="name">{{ item.label }}</span>
          <span class="track" aria-hidden="true"
            ><span class="fill" [style.width.%]="item.percent"></span
          ></span>
          <span class="value">{{ item.value }}</span>
        </li>
      } @empty {
        <li class="none">Sin datos todavía.</li>
      }
    </ul>
  `,
  styles: `
    .bars {
      display: grid;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      grid-template-columns: minmax(5rem, 1fr) minmax(3rem, 2fr) auto;
      align-items: center;
      gap: var(--rc-space-md);
      font-size: var(--rc-font-size-label);
    }

    .name {
      overflow-wrap: anywhere;
      font-weight: 600;
    }

    .track {
      display: block;
      height: 0.5rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-progress-track);
      overflow: hidden;
    }

    .fill {
      display: block;
      height: 100%;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-progress);
    }

    .value {
      min-width: 1.5rem;
      text-align: end;
      font-weight: 800;
    }

    .none {
      display: block;
      color: var(--rc-text-muted);
    }
  `,
})
export class BarList {
  readonly items = input.required<readonly BarItem[]>();
  /** Accessible name of the list. */
  readonly label = input.required<string>();

  protected readonly rows = computed(() => {
    const max = Math.max(0, ...this.items().map((item) => item.value));
    return this.items().map((item) => ({
      ...item,
      percent: max === 0 ? 0 : Math.max(item.value > 0 ? 4 : 0, (item.value / max) * 100),
    }));
  });
}
