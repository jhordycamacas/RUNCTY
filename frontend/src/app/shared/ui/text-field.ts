import {
  Component,
  ElementRef,
  afterRenderEffect,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonInputPasswordToggle } from '@ionic/angular';
import { focusNextField } from '../forms/focus-next';

/**
 * Outlined text input wired to Angular forms. The error comes from the page (which knows when
 * to show it); Ionic renders it under the field and links it with `aria-describedby`.
 * Pressing Enter on a field with `enterkeyhint="next"` moves to the next field of the form
 * instead of submitting it.
 */
@Component({
  selector: 'app-text-field',
  imports: [IonInput, IonInputPasswordToggle],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextField), multi: true },
  ],
  template: `
    <ion-input
      #field
      [label]="label()"
      labelPlacement="floating"
      fill="outline"
      [type]="type()"
      [value]="value()"
      [disabled]="disabled()"
      [placeholder]="placeholder()"
      [inputmode]="inputmode()"
      [autocomplete]="autocomplete()"
      [enterkeyhint]="enterkeyhint()"
      [maxlength]="maxlength()"
      [helperText]="hint()"
      [errorText]="error() ?? ''"
      (ionInput)="changed($event.detail.value)"
      (ionBlur)="onTouched()"
      (keydown.enter)="enter($event)"
    >
      @if (type() === 'password') {
        <ion-input-password-toggle slot="end" />
      }
    </ion-input>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TextField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly inputmode = input<IonInput['inputmode']>();
  readonly autocomplete = input<IonInput['autocomplete']>('off');
  readonly enterkeyhint = input<IonInput['enterkeyhint']>();
  readonly maxlength = input<number>();

  protected readonly value = signal('');
  private readonly field = viewChild.required('field', { read: ElementRef<HTMLElement> });
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    // Ionic only shows `errorText` while the input has `ion-invalid` and `ion-touched`. A
    // `[class.*]` binding loses that race: ion-input re-renders its own host classes when
    // `errorText` changes and drops them, so the error never appeared and «Crear cuenta» looked
    // dead. Setting the classes after each render keeps them.
    afterRenderEffect(() => {
      const invalid = !!this.error();
      const classes = this.field().nativeElement.classList;
      classes.toggle('ion-invalid', invalid);
      classes.toggle('ion-touched', invalid);
    });
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

  protected changed(value: string | null | undefined): void {
    this.value.set(value ?? '');
    this.onChange(value ?? '');
  }

  protected enter(event: Event): void {
    if (this.enterkeyhint() === 'next') focusNextField(event);
  }
}
