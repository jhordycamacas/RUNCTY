import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * Native multi-line text field wired to Angular forms, outlined like the text fields. The hint
 * and the error (from the page) are linked with `aria-describedby`.
 */
@Component({
  selector: 'app-textarea-field',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaField), multi: true },
  ],
  template: `
    <label class="field" [class.invalid]="!!error()" [for]="id">
      <span class="label">{{ label() }}</span>
      <textarea
        [id]="id"
        [rows]="rows()"
        [value]="value()"
        [disabled]="disabled()"
        [attr.maxlength]="maxlength() ?? null"
        [attr.placeholder]="placeholder() ?? null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (input)="changed($event)"
        (blur)="onTouched()"
      ></textarea>
    </label>
    @if (error(); as text) {
      <p class="error" [id]="id + '-error'">{{ text }}</p>
    } @else if (hint(); as text) {
      <p class="hint" [id]="id + '-hint'">{{ text }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-xs);
      padding: var(--rc-space-xs) var(--rc-space-lg) var(--rc-space-sm);
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

    textarea {
      width: 100%;
      min-height: var(--rc-min-touch-target);
      border: 0;
      background: transparent;
      color: var(--rc-text);
      font: inherit;
      resize: vertical;
    }

    .error,
    .hint {
      margin: var(--rc-space-xs) 0 0;
      font-size: var(--rc-font-size-caption);
    }

    .error {
      color: var(--rc-danger);
    }

    .hint {
      color: var(--rc-text-muted);
    }
  `,
})
export class TextareaField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly rows = input(3);
  readonly maxlength = input<number>();
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);

  protected readonly id = `textarea-field-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected describedBy(): string | null {
    if (this.error()) return `${this.id}-error`;
    return this.hint() ? `${this.id}-hint` : null;
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

  protected changed(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}
