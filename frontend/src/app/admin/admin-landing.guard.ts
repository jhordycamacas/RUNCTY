import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ADMIN_SECTIONS } from './admin-sections';

/**
 * `/admin` opens the first section the user may use, instead of a fixed one that can be a dead
 * end for roles without that permission. With no permitted section the empty state is shown.
 */
export const adminLandingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const first = ADMIN_SECTIONS.find((section) => auth.can(section.permission));
  return first ? router.createUrlTree(['/admin', first.path]) : true;
};
