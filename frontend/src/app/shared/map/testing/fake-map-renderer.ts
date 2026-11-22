import { Provider } from '@angular/core';
import { MAP_RENDERER, MapRenderer, MapScene, MountedMap } from '../map-renderer';

/** Records what the screens ask the map to show, without a real map (it needs a laid-out DOM). */
export class FakeMapRenderer extends MapRenderer {
  readonly scenes: MapScene[] = [];
  mounts = 0;
  destroyed = 0;

  /** The last scene shown. */
  get scene(): MapScene | undefined {
    return this.scenes.at(-1);
  }

  mount(): MountedMap {
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
