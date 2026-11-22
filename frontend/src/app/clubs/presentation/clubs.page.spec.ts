import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClubsPage } from './clubs.page';

describe('ClubsPage', () => {
  it('tells what the clubs tab will offer, without fake clubs', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ClubsPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Corre en grupo');
    expect(text).toContain('Gacelas Running Team');
  });
});
