import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialog } from '../ui/confirm-dialog';

/** Implemented by the screens that hold a draft the user could lose by leaving. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a screen with unsaved changes. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  const dialog = inject(ConfirmDialog);
  if (!component.hasUnsavedChanges()) return true;
  return dialog.confirm({
    header: 'Cambios sin guardar',
    message: 'Si sales ahora perderás los cambios que hiciste.',
    confirmText: 'Salir sin guardar',
    cancelText: 'Seguir editando',
    destructive: true,
  });
};
