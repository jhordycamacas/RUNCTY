import { Component, computed, input } from '@angular/core';

/** Up to two initials from the first two words of a name, upper-cased. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * A circle with the user's photo or, without one, their initials on the brand color. It is
 * decorative by default (the name is written next to it); set `labelled` when it stands alone so
 * assistive technology reads the name.
 */
@Component({
  selector: 'app-avatar',
  template: `
    <span class="avatar" [attr.aria-hidden]="labelled() ? null : 'true'">
      @if (photo(); as src) {
        <img [src]="src" [alt]="labelled() ? 'Foto de ' + name() : ''" />
      } @else {
        <span
          class="initials"
          [attr.role]="labelled() ? 'img' : null"
          [attr.aria-label]="labelled() ? name() : null"
          >{{ initials() }}</span
        >
      }
    </span>
  `,
  host: { '[style.--avatar-size]': 'size()' },
  styles: `
    :host {
      display: inline-block;
      flex: none;
    }

    .avatar {
      display: grid;
      place-items: center;
      width: var(--avatar-size, 4rem);
      height: var(--avatar-size, 4rem);
      overflow: hidden;
      border-radius: 50%;
      border: 1px solid var(--rc-border);
      background: var(--rc-primary-tint);
      color: var(--rc-text);
      font-family: var(--rc-font-family-display);
      font-size: calc(var(--avatar-size, 4rem) * 0.4);
      font-weight: 600;    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  /** Full name; the initials and the accessible label come from it. */
  readonly name = input.required<string>();
  /** The photo as a data URL; without it the initials show. */
  readonly photo = input<string | null>(null);
  /** Any CSS length. */
  readonly size = input('4rem');
  readonly labelled = input(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
}
