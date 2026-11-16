import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectField } from './select-field';

@Component({
  imports: [ReactiveFormsModule, SelectField],
  template: `<app-select-field
    label="Dificultad"
    placeholder="Elige la dificultad"
    [options]="options"
    [error]="error()"
    [formControl]="control"
  />`,
})
class Host {
  readonly options = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'advanced', label: 'Avanzado' },
  ];
  readonly control = new FormControl('advanced', { nonNullable: true });
  readonly error = signal<string | null>(null);
}

describe('SelectField', () => {
  const render = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    return { fixture, select };
  };

  it('is labelled and shows the value of the form control', () => {
    const { fixture, select } = render();

    expect(fixture.nativeElement.querySelector('label').textContent).toContain('Dificultad');
    expect(select.labels?.[0]).toBeDefined();
    expect(select.value).toBe('advanced');
  });

  it('writes the chosen option back to the form control', () => {
    const { fixture, select } = render();

    select.value = 'beginner';
    select.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.control.value).toBe('beginner');
  });

  it('links the error to the select', () => {
    const { fixture, select } = render();
    fixture.componentInstance.error.set('Elige la dificultad.');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.error') as HTMLElement;
    expect(message.textContent).toContain('Elige la dificultad.');
    expect(select.getAttribute('aria-describedby')).toBe(message.id);
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });
});
