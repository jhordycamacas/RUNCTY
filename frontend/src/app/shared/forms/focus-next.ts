/** The part of `ion-input` this helper needs. */
interface FocusableInput extends HTMLElement {
  setFocus(): Promise<void>;
}

/**
 * Enter on a field that shows a "next" key moves to the following input of the same form
 * instead of submitting it. Returns whether the focus moved (nothing happens on the last field,
 * so the form submits as usual).
 */
export function focusNextField(event: Event): boolean {
  const current = (event.target as HTMLElement | null)?.closest('ion-input');
  const fields = Array.from(
    current?.closest('form')?.querySelectorAll<FocusableInput>('ion-input') ?? [],
  );
  const next = fields[fields.indexOf(current as FocusableInput) + 1];
  if (!next) return false;
  event.preventDefault();
  void next.setFocus();
  return true;
}
