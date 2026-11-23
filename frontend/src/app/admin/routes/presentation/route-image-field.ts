import { Component, input, output } from '@angular/core';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline, trashOutline } from 'ionicons/icons';
import { Notice } from '../../../shared/ui/notice';

addIcons({ imageOutline, trashOutline });

/**
 * Picks the image a route shows to the runners instead of the generated drawing of its shape. It
 * only reports the chosen file or the wish to remove the image; the form resizes and uploads it.
 */
@Component({
  selector: 'app-route-image-field',
  imports: [IonButton, IonIcon, IonSpinner, Notice],
  template: `
    <fieldset>
      <legend>Imagen de la ruta</legend>
      <p class="hint" id="route-image-hint">
        Opcional. Los corredores la ven en lugar del dibujo de la ruta. JPG, PNG o WebP.
      </p>
      @if (image(); as src) {
        <img [src]="src" alt="Vista previa de la imagen de la ruta" />
      }
      <input
        #picker
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        aria-label="Elegir la imagen de la ruta"
        aria-describedby="route-image-hint"
        (change)="pick(picker)"
      />
      <div class="actions">
        <ion-button fill="outline" [disabled]="busy()" (click)="picker.click()">
          <ion-icon name="image-outline" slot="start" aria-hidden="true" />
          {{ image() ? 'Cambiar imagen' : 'Elegir imagen' }}
        </ion-button>
        @if (image()) {
          <ion-button fill="clear" color="danger" [disabled]="busy()" (click)="removed.emit()">
            <ion-icon name="trash-outline" slot="start" aria-hidden="true" />
            Quitar imagen
          </ion-button>
        }
      </div>
      @if (busy()) {
        <p class="state" role="status"><ion-spinner name="crescent" /> Preparando imagen…</p>
      }
      <app-notice [message]="error()" />
    </fieldset>
  `,
  styles: `
    fieldset {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      min-width: 0;
      margin: 0;
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
    }

    legend {
      padding: 0 var(--rc-space-xs);
      font-weight: 600;
    }

    .hint {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    img {
      display: block;
      width: 100%;
      max-width: 24rem;
      max-height: 14rem;
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
      object-fit: cover;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
    }

    ion-button {
      min-height: var(--rc-min-touch-target);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0;
      color: var(--rc-text-muted);
    }
  `,
})
export class RouteImageField {
  /** The image to preview (a data URL), or null when the route has none. */
  readonly image = input<string | null>(null);
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly picked = output<File>();
  readonly removed = output<void>();

  protected pick(picker: HTMLInputElement): void {
    const file = picker.files?.[0];
    // Cleared so choosing the same file again still fires `change`.
    picker.value = '';
    if (file) this.picked.emit(file);
  }
}
