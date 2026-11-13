import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../shared/ui/confirm-dialog';
import { EmergencyButton } from './emergency-button';
import { PhoneDialer } from './phone-dialer';

describe('EmergencyButton', () => {
  let fixture: ComponentFixture<EmergencyButton>;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;
  let dial: ReturnType<typeof vi.fn<PhoneDialer['dial']>>;

  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  async function press(): Promise<void> {
    button().click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    dial = vi.fn<PhoneDialer['dial']>();
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfirmDialog, useValue: { confirm } },
        { provide: PhoneDialer, useValue: { dial } },
      ],
    });
    fixture = TestBed.createComponent(EmergencyButton);
    fixture.detectChanges();
  });

  it('is a labelled button that says what it does', () => {
    expect(button().textContent).toContain('SOS');
    expect(button().getAttribute('aria-label')).toBe('SOS, llamar al 911 de emergencias');
    expect(button().type).toBe('button');
  });

  it('asks before doing anything', async () => {
    confirm.mockImplementation(() => new Promise(() => undefined));

    await press();

    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm.mock.calls[0][0].header).toBe('¿Llamar al 911?');
    expect(dial).not.toHaveBeenCalled();
  });

  it('opens the dialer with 911 once confirmed', async () => {
    await press();
    await Promise.resolve();

    expect(dial).toHaveBeenCalledExactlyOnceWith('911');
  });

  it('does not dial when the runner cancels', async () => {
    confirm.mockResolvedValue(false);

    await press();
    await Promise.resolve();

    expect(dial).not.toHaveBeenCalled();
  });
});
