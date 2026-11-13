import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput } from '@ionic/angular';
import { focusNextField } from '../forms/focus-next';

interface DateParts {
  day: string;
  month: string;
  year: string;
}

const digitsOnly = (value: string | null | undefined, max: number) =>
  (value ?? '').replace(/\D/g, '').slice(0, max);
const pad = (value: string) => (value.length === 1 ? `0${value}` : value);

/** `YYYY-MM-DD` when the three parts are complete; the raw parts joined otherwise (it fails validation). */
function toValue({ day, month, year }: DateParts): string {
  if (!day && !month && !year) return '';
  return `${year}-${pad(month)}-${pad(day)}`;
}

function toParts(value: string | null): DateParts {
  const [year = '', month = '', day = ''] = (value ?? '').split('-');
  return { day, month, year };
}

/**
 * Birth date as three numeric fields (day, month, year) instead of free text. The value in the
 * form is the ISO date `YYYY-MM-DD`, or an invalid string while the parts are incomplete.
 */
@Component({
  selector: 'app-birth-date-field',
  imports: [IonInput],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BirthDateField), multi: true },
  ],
  template: `
    <fieldset [attr.aria-describedby]="message() ? 'birth-date-message' : null">
      <legend>Fecha de nacimiento</legend>
      <div class="parts">
        <ion-input
          #day
          label="Día"
          labelPlacement="floating"
          fill="outline"
          inputmode="numeric"
          autocomplete="bday-day"
          enterkeyhint="next"
          placeholder="DD"
          [maxlength]="2"
          [value]="parts().day"
          [disabled]="disabled()"
          [class.ion-invalid]="!!message()"
          [class.ion-touched]="!!message()"
          (ionInput)="edit(day, 'day', $event.detail.value, 2, month)"
          (ionBlur)="onTouched()"
          (keydown.enter)="focusNext($event)"
        />
        <ion-input
          #month
          label="Mes"
          labelPlacement="floating"
          fill="outline"
          inputmode="numeric"
          autocomplete="bday-month"
          enterkeyhint="next"
          placeholder="MM"
          [maxlength]="2"
          [value]="parts().month"
          [disabled]="disabled()"
          [class.ion-invalid]="!!message()"
          [class.ion-touched]="!!message()"
          (ionInput)="edit(month, 'month', $event.detail.value, 2, year)"
          (ionBlur)="onTouched()"
          (keydown.enter)="focusNext($event)"
        />
        <ion-input
          #year
          label="Año"
          labelPlacement="floating"
          fill="outline"
          inputmode="numeric"
          autocomplete="bday-year"
          enterkeyhint="next"
          placeholder="AAAA"
          [maxlength]="4"
          [value]="parts().year"
          [disabled]="disabled()"
          [class.ion-invalid]="!!message()"
          [class.ion-touched]="!!message()"
          (ionInput)="edit(year, 'year', $event.detail.value, 4)"
          (ionBlur)="onTouched()"
          (keydown.enter)="focusNext($event)"
        />
      </div>
      @if (message(); as text) {
        <p id="birth-date-message" class="error" role="alert">{{ text }}</p>
      }
    </fieldset>
  `,
  styles: `
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
    }

    legend {
      margin-bottom: var(--rc-space-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .parts {
      display: grid;
      grid-template-columns: 1fr 1fr 1.5fr;
      gap: var(--rc-space-sm);
    }

    .error {
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }
  `,
})
export class BirthDateField implements ControlValueAccessor {
  /** Validation message of the form control, shown when the page decides so. */
  readonly error = input<string | null>(null);

  protected readonly parts = signal<DateParts>({ day: '', month: '', year: '' });
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  /** Parts typed but not complete (for example only the year): a clearer text than the format error. */
  protected message(): string | null {
    const { day, month, year } = this.parts();
    const incomplete = !day || !month || year.length !== 4;
    const touched = day || month || year;
    return this.error() && touched && incomplete ? 'Completa día, mes y año.' : this.error();
  }

  protected focusNext(event: Event): void {
    focusNextField(event);
  }

  writeValue(value: string | null): void {
    this.parts.set(toParts(value));
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

  protected edit(
    field: IonInput,
    part: keyof DateParts,
    raw: string | null | undefined,
    length: number,
    next?: IonInput,
  ): void {
    const value = digitsOnly(raw, length);
    // Drops the characters the user typed that are not digits.
    field.value = value;
    this.parts.update((parts) => ({ ...parts, [part]: value }));
    this.onChange(toValue(this.parts()));
    if (next && value.length === length) void next.setFocus();
  }
}
