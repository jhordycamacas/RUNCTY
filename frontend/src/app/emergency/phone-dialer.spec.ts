import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PhoneDialer } from './phone-dialer';

describe('PhoneDialer', () => {
  it('navigates to a tel: link, which opens the phone dialer', () => {
    const location = { href: '' };
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { location } }] });

    TestBed.inject(PhoneDialer).dial('911');

    expect(location.href).toBe('tel:911');
  });
});
