import { TestBed } from '@angular/core/testing';
import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  async function render(size?: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(BrandLogo);
    if (size) fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('carries the light and the dark logo, both decorative', async () => {
    const images = Array.from((await render()).querySelectorAll('img'));

    expect(images.map((image) => image.getAttribute('src'))).toEqual([
      'brand/logo.png',
      'brand/logo-dark.png',
    ]);
    expect(images.every((image) => image.getAttribute('alt') === '')).toBe(true);
  });

  it('takes its side from the size input', async () => {
    const host = await render('6.5rem');

    expect(host.style.getPropertyValue('--logo-size')).toBe('6.5rem');
  });
});
