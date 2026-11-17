import { Component, computed, input } from '@angular/core';

/** A labelled progress bar with its percentage written out. */
@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="head">
      <span class="label">{{ label() }}</span>
      <span class="percent">{{ clamped() }}%</span>
    </div>
    <div
      class="track"
      role="progressbar"
      [attr.aria-label]="label()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="clamped()"
    >
      <span class="fill" [style.width.%]="clamped()"></span>
    </div>
    @if (detail(); as text) {
      <p class="detail">{{ text }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .head {
      display: flex;
      justify-content: space-between;
      gap: var(--rc-space-md);
      font-size: var(--rc-font-size-label);
      font-weight: 600;
    }

    .percent {
      font-size: var(--rc-font-size-subtitle);
      font-weight: 800;
    }

    .track {
      height: 0.625rem;
      margin-top: var(--rc-space-sm);
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

    .detail {
      margin: var(--rc-space-sm) 0 0;
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
    }
  `,
})
export class ProgressBar {
  readonly label = input.required<string>();
  /** 0 to 100. */
  readonly percent = input.required<number>();
  readonly detail = input<string>('');

  protected readonly clamped = computed(() => Math.min(100, Math.max(0, Math.round(this.percent()))));
}
