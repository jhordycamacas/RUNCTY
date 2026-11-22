import { Injectable } from '@angular/core';
import { Geolocation, PermissionStatus, Position } from '@capacitor/geolocation';
import {
  PositionProblem,
  PositionSource,
  PositionSourceError,
  StopWatching,
} from '../domain/position-source';
import { PositionFix } from '../domain/run-tracker';

/** Browser and Capacitor geolocation error code for a refused permission. */
const PERMISSION_DENIED = 1;

const toFix = (position: Position): PositionFix => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  accuracyM: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
  timestamp: position.timestamp,
});

const problemOf = (error: unknown): PositionProblem => {
  const code = (error as { code?: unknown } | null)?.code;
  const message = String((error as { message?: unknown } | null)?.message ?? '');
  return code === PERMISSION_DENIED || /denied|permission/i.test(message) ? 'denied' : 'unavailable';
};

/**
 * The GPS through `@capacitor/geolocation`: the native plugin on Android, the browser's
 * Geolocation API on the web (where the permission prompt comes with the first watch).
 */
@Injectable()
export class CapacitorPositionSource extends PositionSource {
  async ensurePermission(): Promise<void> {
    let status: PermissionStatus;
    try {
      status = await Geolocation.checkPermissions();
      if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
        status = await Geolocation.requestPermissions({ permissions: ['location'] });
      }
    } catch (error) {
      // The web has no permission request (and some browsers no Permissions API): the first
      // watch asks instead. Location services turned off on the phone also land here.
      if (/not implemented|not available/i.test(String((error as Error)?.message))) return;
      throw new PositionSourceError(problemOf(error));
    }
    if (status.location === 'denied') throw new PositionSourceError('denied');
  }

  async watch(
    onFix: (fix: PositionFix) => void,
    onProblem: (problem: PositionProblem) => void,
  ): Promise<StopWatching> {
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
      (position, error) => {
        if (position) onFix(toFix(position));
        else if (error) onProblem(problemOf(error));
      },
    );
    return () => Geolocation.clearWatch({ id });
  }
}
