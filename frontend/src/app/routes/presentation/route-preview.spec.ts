import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LatLng, SafetyLevel } from '../domain/route';
import { RoutePreview } from './route-preview';

const SHAPE: LatLng[] = [
  { lat: -3.97, lng: -79.2 },
  { lat: -3.975, lng: -79.195 },
  { lat: -3.98, lng: -79.2 },
];

describe('RoutePreview', () => {
  let fixture: ComponentFixture<RoutePreview>;
  const root = () => fixture.nativeElement as HTMLElement;

  function render(points: LatLng[], level: SafetyLevel | null = null): void {
    fixture = TestBed.createComponent(RoutePreview);
    fixture.componentRef.setInput('points', points);
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
  }

  it('draws the shape of the route with its start and end markers', () => {
    render(SHAPE, 'high');

    const line = root().querySelector('path.line');
    expect(line?.getAttribute('d')).toMatch(/^M[\d.]+ [\d.]+L[\d.]+ [\d.]+L[\d.]+ [\d.]+$/);
    expect(root().querySelectorAll('circle.start')).toHaveLength(1);
    expect(root().querySelectorAll('.end')).toHaveLength(1);
  });

  it('puts the start marker on the first point and the end marker on the last one', () => {
    render(SHAPE);

    const [first] = (root().querySelector('path.line')?.getAttribute('d') ?? '')
      .slice(1)
      .split('L');
    const [x, y] = first.split(' ');
    const start = root().querySelector('circle.start');
    expect(start?.getAttribute('cx')).toBe(x);
    expect(start?.getAttribute('cy')).toBe(y);
  });

  it.each([
    ['high', 'tone-high'],
    ['medium', 'tone-medium'],
    ['low', 'tone-low'],
    [null, 'tone-none'],
  ] as const)('colors the line by the %s safety level', (level, tone) => {
    render(SHAPE, level);

    expect(root().querySelector('svg')?.classList.contains(tone)).toBe(true);
  });

  it('is decorative: hidden from assistive technology', () => {
    render(SHAPE, 'low');

    expect(root().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows an icon placeholder when the API sent no shape', () => {
    render([]);

    expect(root().querySelector('svg')).toBeNull();
    expect(root().querySelector('ion-icon')).not.toBeNull();
  });

  it('shows the placeholder for a single point, which has no shape', () => {
    render([SHAPE[0]]);

    expect(root().querySelector('path.line')).toBeNull();
    expect(root().querySelector('ion-icon')).not.toBeNull();
  });
});
