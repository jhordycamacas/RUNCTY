import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, chevronDown } from 'ionicons/icons';
import { CitiesStore } from '../application/cities.store';

addIcons({ checkmark, chevronDown });

const withoutAccents = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * City select with search. A modal lists the cities and filters them as the user types, so a
 * long catalogue never wraps into rows of chips. The value is the city id.
 */
@Component({
  selector: 'app-city-picker-field',
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonSearchbar,
    IonTitle,
    IonToolbar,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CityPickerField), multi: true },
  ],
  template: `
    @if (store.cities() === null && store.error(); as failure) {
      <div class="state" role="alert">
        <p>{{ failure }}</p>
        <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
      </div>
    } @else if (store.cities() === null) {
      <p class="state muted" role="status">Cargando ciudades…</p>
    } @else if (store.cities()?.length === 0) {
      <p class="state muted" role="status">Aún no hay ciudades disponibles.</p>
    } @else {
      <button
        type="button"
        class="picker"
        [class.invalid]="!!error()"
        [disabled]="disabled()"
        [attr.aria-describedby]="error() ? 'city-error' : null"
        (click)="open()"
      >
        <span class="label">Ciudad</span>
        <span class="value" [class.placeholder]="!selected()">{{
          selected()?.name ?? 'Selecciona tu ciudad'
        }}</span>
        <ion-icon name="chevron-down" aria-hidden="true" />
      </button>
      @if (error(); as text) {
        <p id="city-error" class="error" role="alert">{{ text }}</p>
      }
      <ion-modal [isOpen]="opened()" (didDismiss)="close()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Ciudad</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="close()">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
            <ion-toolbar>
              <ion-searchbar
                placeholder="Buscar ciudad"
                [debounce]="100"
                (ionInput)="query.set($event.detail.value ?? '')"
              />
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list>
              @for (city of filtered(); track city.id) {
                <ion-item
                  button
                  detail="false"
                  [attr.aria-current]="city.id === value() ? 'true' : null"
                  (click)="choose(city.id)"
                >
                  <ion-label>
                    {{ city.name }}
                    @if (city.province) {
                      <p>{{ city.province }}</p>
                    }
                  </ion-label>
                  @if (city.id === value()) {
                    <ion-icon name="checkmark" slot="end" aria-label="Seleccionada" />
                  }
                </ion-item>
              } @empty {
                <ion-item lines="none">
                  <ion-label>No encontramos una ciudad con ese nombre.</ion-label>
                </ion-item>
              }
            </ion-list>
          </ion-content>
        </ng-template>
      </ion-modal>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .picker {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      width: 100%;
      min-height: 56px;
      padding: var(--rc-space-sm) var(--rc-space-lg);
      border: 1px solid var(--rc-control-border);
      border-radius: var(--rc-radius-sm);
      background: transparent;
      color: var(--rc-text);
      font: inherit;
      text-align: left;
    }

    .picker.invalid {
      border-color: var(--rc-danger);
    }

    .label {
      grid-column: 1;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    .value {
      grid-column: 1;
    }

    .placeholder {
      color: var(--rc-text-muted);
    }

    ion-icon {
      grid-row: 1 / span 2;
      grid-column: 2;
    }

    .state {
      margin: 0;
    }

    .muted {
      color: var(--rc-text-muted);
    }

    .error {
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }
  `,
})
export class CityPickerField implements ControlValueAccessor {
  protected readonly store = inject(CitiesStore);

  /** Validation message of the form control, shown when the page decides so. */
  readonly error = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly opened = signal(false);
  protected readonly query = signal('');
  protected readonly selected = computed(() => this.store.byId().get(this.value()) ?? null);
  protected readonly filtered = computed(() => {
    const needle = withoutAccents(this.query().trim());
    return (this.store.cities() ?? []).filter((city) => withoutAccents(city.name).includes(needle));
  });
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    void this.store.load();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected open(): void {
    this.query.set('');
    this.opened.set(true);
  }

  protected close(): void {
    this.opened.set(false);
    this.onTouched();
  }

  protected choose(id: string): void {
    this.value.set(id);
    this.onChange(id);
    this.close();
  }
}
