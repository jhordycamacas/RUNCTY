import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

let nextId = 0;

/**
 * Native select wired to Angular forms, outlined like the text fields. A native control keeps
 * the keyboard and screen reader behaviour of the platform and adds no web component to the
 * initial bundle. The error comes from the page and is linked with `aria-describedby`.
 */
@Component({
  selector: 'app-select-field',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectField), multi: true },
  ],
  template: `
    <label class="field" [class.invalid]="!!error()" [for]="id">
      <span class="label">{{ label() }}</span>
      <select
        [id]="id"
        [disabled]="disabled()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? id + '-error' : null"
        (change)="changed($event)"
        (blur)="onTouched()"
      >
        @if (placeholder(); as text) {
          <option value="" [selected]="value() === ''">{{ text }}</option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">
            {{ option.label }}
          </option>
        }
      </select>
    </label>
    @if (error(); as text) {
      <p class="error" [id]="id + '-error'">{{ text }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .field {
      display: flex;
      flex-direction: column;
      min-height: 56px;
      padding: var(--rc-space-xs) var(--rc-space-lg);
      border: 1px solid var(--rc-control-border);
      border-radius: var(--rc-radius-sm);
    }

    .field.invalid {
      border-color: var(--rc-danger);
    }

    .label {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    select {
      width: 100%;
      min-height: var(--rc-min-touch-target);
      border: 0;
      background: transparent;
      color: var(--rc-text);
      font: inherit;
    }

    .error {
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }
  `,
})
export class SelectField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  /** First, empty choice; without it the select always holds one of the options. */
  readonly placeholder = input<string>();
  readonly error = input<string | null>(null);

  protected readonly id = `select-field-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

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

  protected changed(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}
