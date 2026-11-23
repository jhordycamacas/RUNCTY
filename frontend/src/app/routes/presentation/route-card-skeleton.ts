import { Component } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular';

/** Placeholder with the shape of a route card, shown while the routes load. Decorative. */
@Component({
  selector: 'app-route-card-skeleton',
  imports: [IonSkeletonText],
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="card">
      <div class="top">
        <ion-skeleton-text class="thumb" [animated]="true" />
        <div class="lines">
          <ion-skeleton-text class="title" [animated]="true" />
          <ion-skeleton-text class="figure" [animated]="true" />
          <ion-skeleton-text class="meta" [animated]="true" />
        </div>
      </div>
      <ion-skeleton-text class="badge" [animated]="true" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--rc-space-md);
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .top {
      display: flex;
      gap: var(--rc-space-md);
    }

    .thumb {
      flex: none;
      width: 5.5rem;
      height: 5.5rem;
      margin: 0;
      border-radius: var(--rc-radius-sm);
    }

    .lines {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: var(--rc-space-sm);
      justify-content: center;
    }

    ion-skeleton-text {
      margin: 0;
    }

    .title {
      width: 70%;
      height: 1.1rem;
    }

    .figure {
      width: 40%;
      height: 1.8rem;
    }

    .meta {
      width: 90%;
      height: 0.8rem;
    }

    .badge {
      width: 45%;
      height: 1.8rem;
      border-radius: var(--rc-radius-pill);
    }
  `,
})
export class RouteCardSkeleton {}
