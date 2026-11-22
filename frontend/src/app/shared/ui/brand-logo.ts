import { Component, input } from '@angular/core';

/**
 * The club logo as a rounded square tile, in the version that matches the active theme: the light
 * tile on the light theme and the dark one on the dark theme (`data-theme` on `<html>`, where
 * `system` follows the device). The swap is pure CSS so it follows the theme without code. The
 * logo is decorative: the screen names itself next to it.
 */
@Component({
  selector: 'app-brand-logo',
  host: { '[style.--logo-size]': 'size()' },
  template: `
    <img class="light" src="brand/logo.png" alt="" loading="lazy" />
    <img class="dark" src="brand/logo-dark.png" alt="" loading="lazy" />
  `,
  styles: `
    :host {
      display: block;
      flex: none;
      width: var(--logo-size);
      height: var(--logo-size);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 22%;
      object-fit: cover;
    }

    .dark {
      display: none;
    }

    :host-context([data-theme='dark']) .light {
      display: none;
    }

    :host-context([data-theme='dark']) .dark {
      display: block;
    }

    @media (prefers-color-scheme: dark) {
      :host-context([data-theme='system']) .light {
        display: none;
      }

      :host-context([data-theme='system']) .dark {
        display: block;
      }
    }
  `,
})
export class BrandLogo {
  /** Side of the square, as a CSS length. */
  readonly size = input('2.5rem');
}
