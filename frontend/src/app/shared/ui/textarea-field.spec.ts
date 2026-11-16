import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextareaField } from './textarea-field';

@Component({
  imports: [ReactiveFormsModule, TextareaField],
  template: `<app-textarea-field
    label="Puntos"
    hint="Uno por línea"
    [error]="error()"
    [formControl]="control"
  />`,
})
class Host {
  readonly control = new FormControl('-3.9, -79.2', { nonNullable: true });
  readonly error = signal<string | null>(null);
}

describe('TextareaField', () => {
  const render = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    return { fixture, field };
  };

  it('is labelled, shows the value and describes itself with the hint', () => {
    const { fixture, field } = render();

    expect(field.labels?.[0]?.textContent).toContain('Puntos');
    expect(field.value).toBe('-3.9, -79.2');
    const hint = fixture.nativeElement.querySelector('.hint') as HTMLElement;
    expect(field.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('writes what is typed back to the form control', () => {
    const { fixture, field } = render();

    field.value = '1, 2\n3, 4';
    field.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.control.value).toBe('1, 2\n3, 4');
  });

  it('replaces the hint with the error and links it', () => {
    const { fixture, field } = render();
    fixture.componentInstance.error.set('Ingresa al menos 2 puntos.');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.error') as HTMLElement;
    expect(message.textContent).toContain('Ingresa al menos 2 puntos.');
    expect(fixture.nativeElement.querySelector('.hint')).toBeNull();
    expect(field.getAttribute('aria-describedby')).toBe(message.id);
    expect(field.getAttribute('aria-invalid')).toBe('true');
  });
});
