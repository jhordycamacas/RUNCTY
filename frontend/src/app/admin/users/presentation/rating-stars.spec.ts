import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RatingStars } from './rating-stars';

@Component({
  imports: [RatingStars],
  template: `<app-rating-stars [average]="average" [count]="count" />`,
})
class Host {
  average = 4.3;
  count = 12;
}

describe('RatingStars', () => {
  function render(average: number, count: number): HTMLElement {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.average = average;
    fixture.componentInstance.count = count;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const widths = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>('.fill')].map((el) => el.style.width);

  it('draws five stars filled in proportion to the average', () => {
    const root = render(4.3, 12);

    expect(root.querySelectorAll('.star')).toHaveLength(5);
    expect(widths(root)).toEqual(['100%', '100%', '100%', '100%', '30%']);
  });

  it('draws an empty and a full scale at the ends', () => {
    expect(widths(render(0, 1))).toEqual(['0%', '0%', '0%', '0%', '0%']);
    expect(widths(render(5, 1))).toEqual(['100%', '100%', '100%', '100%', '100%']);
  });

  it('reads as one image with a text alternative, and hides the drawing from readers', () => {
    const root = render(4.3, 12);

    const image = root.querySelector('[role="img"]');
    expect(image?.getAttribute('aria-label')).toBe('4,3 de 5 estrellas, 12 valoraciones');
    expect(root.querySelector('.stars')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.textContent).toContain('4,3');
    expect(root.textContent).toContain('12 valoraciones');
  });
});
