import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CityPickerField } from '../../cities/presentation/city-picker-field';
import { BirthDateField } from '../../shared/ui/birth-date-field';
import { TextField } from '../../shared/ui/text-field';
import { PersonalData } from '../domain/personal-data';

/**
 * Personal data inputs shared by sign-up (RF-01-1) and profile editing (RF-01-3). The form must
 * hold the `PersonalData` controls; the page decides which messages to show.
 */
@Component({
  selector: 'app-personal-data-fields',
  imports: [ReactiveFormsModule, BirthDateField, CityPickerField, TextField],
  template: `
    <div class="fields" [formGroup]="form()">
      <app-text-field
        formControlName="firstName"
        label="Nombres"
        autocomplete="given-name"
        enterkeyhint="next"
        [error]="errorFor()('firstName')"
      />
      <app-text-field
        formControlName="lastName"
        label="Apellidos"
        autocomplete="family-name"
        enterkeyhint="next"
        [error]="errorFor()('lastName')"
      />
      <app-birth-date-field formControlName="birthDate" [error]="errorFor()('birthDate')" />
      <app-city-picker-field formControlName="cityId" [error]="errorFor()('cityId')" />
      <app-text-field
        formControlName="idNumber"
        label="Cédula (opcional)"
        inputmode="numeric"
        hint="10 dígitos. Puedes dejarlo vacío."
        enterkeyhint="next"
        [maxlength]="10"
        [error]="errorFor()('idNumber')"
      />
    </div>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }
  `,
})
export class PersonalDataFields {
  readonly form = input.required<FormGroup>();
  readonly errorFor = input.required<(field: keyof PersonalData) => string | null>();
}
