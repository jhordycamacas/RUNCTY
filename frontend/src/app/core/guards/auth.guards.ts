import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { homeUrl } from '../auth/home-route';
import { Permission } from '../permissions/permissions';

/**
 * Takes no arguments, so each guard works both as `canMatch` (a lazy bundle is not downloaded
 * for someone who cannot use it) and as `canActivate`.
 * Every `inject()` runs before the first `await`: afterwards there is no injection context.
 */
type Guard = () => Promise<boolean | UrlTree>;

/** Requires a signed-in user; otherwise goes to `/login` and remembers where the user was heading. */
export const sessionGuard: Guard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const target = router.getCurrentNavigation()?.extractedUrl;

  await auth.restore();
  if (auth.session()) return true;

  const returnUrl = target ? router.serializeUrl(target) : null;
  return router.createUrlTree(['/login'], returnUrl ? { queryParams: { returnUrl } } : {});
};

/** Requires a permission read from the API session; a signed-in user without it gets the 403 page. */
export function permissionGuard(permission: Permission): Guard {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const verdict = await sessionGuard();
    if (verdict !== true) return verdict;
    return auth.can(permission) || router.createUrlTree(['/403']);
  };
}

/** For `/login`: a user who is already signed in goes straight to their area. */
export const guestGuard: Guard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restore();
  return auth.session() ? router.parseUrl(homeUrl(auth.session())) : true;
};

/** For `/`: sends the user to their area, or to `/login`. */
export const homeGuard: Guard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restore();
  return router.parseUrl(auth.session() ? homeUrl(auth.session()) : '/login');
};
