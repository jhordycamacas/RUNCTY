import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTimeField } from './date-time-field';

@Component({
  imports: [ReactiveFormsModule, DateTimeField],
  template: `<app-date-time-field
    type="time"
    label="Hora de inicio"
    hint="Formato de 24 horas."
    [error]="error()"
    [formControl]="control"
  />`,
})
class Host {
  readonly control = new FormControl('05:30', { nonNullable: true });
  readonly error = signal<string | null>(null);
}

describe('DateTimeField', () => {
  const render = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, field };
  };

  it('is a labelled native input of the given type showing the form control value', () => {
    const { field } = render();

    expect(field.type).toBe('time');
    expect(field.labels?.[0]?.textContent).toContain('Hora de inicio');
    expect(field.value).toBe('05:30');
  });

  it('writes the typed value back to the form control', () => {
    const { fixture, field } = render();

    field.value = '18:45';
    field.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.control.value).toBe('18:45');
  });

  it('links the hint, and the error when there is one, to the input', () => {
    const { fixture, field } = render();
    expect(field.getAttribute('aria-describedby')).toContain('-hint');
    fixture.componentInstance.error.set('Elige la hora de inicio.');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.error') as HTMLElement;
    expect(message.textContent).toContain('Elige la hora de inicio.');
    expect(field.getAttribute('aria-describedby')).toContain(message.id);
    expect(field.getAttribute('aria-invalid')).toBe('true');
  });
});
