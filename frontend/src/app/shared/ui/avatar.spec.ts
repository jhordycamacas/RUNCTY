import { TestBed } from '@angular/core/testing';
import { Avatar, initialsOf } from './avatar';

describe('initialsOf', () => {
  it('takes the first letter of the first two words, upper-cased', () => {
    expect(initialsOf('ana torres')).toBe('AT');
    expect(initialsOf('  Ana María de la Torre ')).toBe('AM');
  });

  it('copes with one word and with nothing', () => {
    expect(initialsOf('Ana')).toBe('A');
    expect(initialsOf('')).toBe('');
  });
});

describe('Avatar', () => {
  async function render(inputs: Record<string, unknown>): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Avatar);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the photo when there is one', async () => {
    const host = await render({ name: 'Ana Torres', photo: 'data:image/jpeg;base64,AAAA' });

    expect(host.querySelector('img')?.getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
    expect(host.textContent?.trim()).toBe('');
  });

  it('shows the initials when there is no photo', async () => {
    const host = await render({ name: 'Ana Torres', photo: null });

    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent?.trim()).toBe('AT');
  });

  it('is decorative by default, because the name is shown next to it', async () => {
    const host = await render({ name: 'Ana Torres', photo: 'data:image/jpeg;base64,AAAA' });

    expect(host.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(host.querySelector('[role="img"]')).toBeNull();
    expect(host.querySelector('.avatar')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gets an accessible name when it stands alone', async () => {
    const withPhoto = await render({ name: 'Ana Torres', photo: 'data:image/jpeg;base64,AAAA', labelled: true });
    const initials = await render({ name: 'Ana Torres', photo: null, labelled: true });

    expect(withPhoto.querySelector('img')?.getAttribute('alt')).toBe('Foto de Ana Torres');
    expect(initials.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Ana Torres');
  });

  it('takes its side from the size input', async () => {
    const host = await render({ name: 'Ana Torres', size: '6rem' });

    expect(host.style.getPropertyValue('--avatar-size')).toBe('6rem');
  });
});
