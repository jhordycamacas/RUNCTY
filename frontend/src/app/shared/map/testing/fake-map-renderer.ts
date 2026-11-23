import { Provider } from '@angular/core';
import {
  MAP_RENDERER,
  MapHooks,
  MapPoint,
  MapRenderer,
  MapScene,
  MountedMap,
} from '../map-renderer';

/** Records what the screens ask the map to show, without a real map (it needs a laid-out DOM). */
export class FakeMapRenderer extends MapRenderer {
  readonly scenes: MapScene[] = [];
  mounts = 0;
  destroyed = 0;

  /** The last scene shown. */
  get scene(): MapScene | undefined {
    return this.scenes.at(-1);
  }

  private hooks: MapHooks | undefined;

  /** Simulates a click on the map. */
  click(point: MapPoint): void {
    this.hooks?.click?.(point);
  }

  mount(_host?: HTMLElement, hooks?: MapHooks): MountedMap {
    this.hooks = hooks;
    this.mounts++;
    return {
      show: (scene) => this.scenes.push(scene),
      destroy: () => this.destroyed++,
    };
  }
}

export function provideFakeMapRenderer(renderer = new FakeMapRenderer()): Provider {
  return { provide: MAP_RENDERER, useValue: () => Promise.resolve(renderer) };
}
