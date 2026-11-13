import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** Opens the phone dialer with a number typed in. The user still has to press call. */
@Injectable({ providedIn: 'root' })
export class PhoneDialer {
  private readonly document = inject(DOCUMENT);

  dial(number: string): void {
    this.document.location.href = `tel:${number}`;
  }
}
