import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * Native time or date input wired to Angular forms, outlined like the text fields. The platform
 * picker keeps keyboard and screen reader support and adds no web component to the initial
 * bundle. The value is the native one (`HH:MM` or `YYYY-MM-DD`), blank when not set.
 */
@Component({
  selector: 'app-date-time-field',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateTimeField), multi: true },
  ],
  template: `
    <label class="field" [class.invalid]="!!error()" [for]="id">
      <span class="label">{{ label() }}</span>
      <input
        [id]="id"
        [type]="type()"
        [value]="value()"
        [disabled]="disabled()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (input)="changed($event)"
        (blur)="onTouched()"
      />
    </label>
    @if (hint(); as text) {
      <p class="hint" [id]="id + '-hint'">{{ text }}</p>
    }
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

    input {
      width: 100%;
      min-height: var(--rc-min-touch-target);
      border: 0;
      background: transparent;
      color: var(--rc-text);
      font: inherit;
    }

    .hint,
    .error {
      margin: var(--rc-space-xs) 0 0;
      font-size: var(--rc-font-size-caption);
    }

    .hint {
      color: var(--rc-text-muted);
    }

    .error {
      color: var(--rc-danger);
    }
  `,
})
export class DateTimeField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input.required<'time' | 'date'>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);

  protected readonly id = `date-time-field-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly describedBy = computed(
    () =>
      [this.hint() ? `${this.id}-hint` : null, this.error() ? `${this.id}-error` : null]
        .filter(Boolean)
        .join(' ') || null,
  );
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
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}
