import { NgTemplateOutlet } from '@angular/common';
import { Component, Injectable, TemplateRef, inject, input, signal } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular';

/**
 * The account actions of the admin top bar (theme, user, sign-out). The shell owns them and
 * hands their template over here on wide screens; each page's header draws it at its right end.
 */
@Injectable({ providedIn: 'root' })
export class AdminTopbar {
  readonly actions = signal<TemplateRef<unknown> | null>(null);
}

/**
 * Top bar of an admin page: one flex row inside the page frame, with the menu button (narrow
 * screens) or a back button, the large page title on the left and the shell's actions on the
 * right. It shares the frame's gutter, so the title lines up with the content below.
 */
@Component({
  selector: 'app-admin-header',
  imports: [IonBackButton, IonButtons, IonHeader, IonMenuButton, IonToolbar, NgTemplateOutlet],
  template: `
    <ion-header>
      <ion-toolbar>
        <div class="bar">
          <ion-buttons>
            @if (backTo(); as href) {
              <ion-back-button [defaultHref]="href" text="Atrás" />
            } @else {
              <ion-menu-button />
            }
          </ion-buttons>
          <h1>{{ title() }}</h1>
          @if (topbar.actions(); as actions) {
            <div class="actions">
              <ng-container [ngTemplateOutlet]="actions" />
            </div>
          }
        </div>
      </ion-toolbar>
    </ion-header>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      min-width: 0;
      min-height: var(--rc-topbar-height);
    }

    // The menu button hides itself while the sidebar is open; then the slot takes no room.
    ion-buttons:empty,
    ion-buttons:not(:has(ion-back-button, ion-menu-button:not(.menu-button-hidden))) {
      display: none;
    }

    h1 {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      font-size: clamp(1.375rem, 2.2vw, 1.875rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      flex: none;
      align-items: center;
      gap: var(--rc-space-sm);
    }
  `,
})
export class AdminHeader {
  readonly title = input.required<string>();
  /** Where the back button goes when there is no history; without it the menu button shows. */
  readonly backTo = input<string | null>(null);

  protected readonly topbar = inject(AdminTopbar);
}
