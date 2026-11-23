import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline } from 'ionicons/icons';
import { ratingText, starFills } from '../domain/rating';

addIcons({ star, starOutline });

/**
 * A rating out of five as five stars, each filled in proportion to the average. The drawing is
 * hidden from screen readers; one text alternative ("4,3 de 5 estrellas, 12 valoraciones")
 * describes the whole.
 */
@Component({
  selector: 'app-rating-stars',
  imports: [IonIcon],
  template: `
    <span class="rating" role="img" [attr.aria-label]="text()">
      <span class="stars" aria-hidden="true">
        @for (width of widths(); track $index) {
          <span class="star">
            <ion-icon class="base" name="star-outline" />
            <span class="fill" [style.width.%]="width">
              <ion-icon name="star" />
            </span>
          </span>
        }
      </span>
    </span>
    <span class="summary" aria-hidden="true">{{ text() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .stars {
      display: inline-flex;
      gap: var(--rc-space-xs);
      font-size: 1.5rem;
      line-height: 0;
    }

    .star {
      position: relative;
      display: inline-block;
    }

    .base {
      color: var(--rc-control-border);
    }

    .fill {
      position: absolute;
      inset: 0 auto 0 0;
      overflow: hidden;
      color: var(--rc-warning);
    }

    .fill ion-icon {
      max-width: none;
    }

    .summary {
      color: var(--rc-text-muted);
    }
  `,
})
export class RatingStars {
  /** Out of five. */
  readonly average = input.required<number>();
  readonly count = input.required<number>();

  /** Percentage of each star that is filled. */
  protected readonly widths = computed(() =>
    starFills(this.average()).map((fill) => Math.round(fill * 100)),
  );
  protected readonly text = computed(() => ratingText(this.average(), this.count()));
}
