import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { map } from 'rxjs';

/**
 * The complete raw value of a form as a signal, so validation can be a `computed` over the
 * domain rules. Call it in an injection context (a field initializer).
 */
export function formValues<G extends FormGroup>(form: G): Signal<ReturnType<G['getRawValue']>> {
  return toSignal(form.valueChanges.pipe(map(() => form.getRawValue())), {
    initialValue: form.getRawValue(),
  });
}
