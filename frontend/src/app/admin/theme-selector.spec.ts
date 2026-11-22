import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferencesStore } from '../preferences/application/preferences.store';
import { Preferences, defaultPreferences } from '../preferences/domain/preferences';
import { ToastService } from '../shared/ui/toast.service';
import { ThemeSelector } from './theme-selector';

describe('ThemeSelector', () => {
  let fixture: ComponentFixture<ThemeSelector>;
  let current: ReturnType<typeof signal<Preferences>>;
  let save: ReturnType<typeof vi.fn<PreferencesStore['save']>>;
  let error: ReturnType<typeof vi.fn<ToastService['error']>>;

  const select = () => fixture.nativeElement.querySelector('select') as HTMLSelectElement;
  const choose = async (value: string) => {
    select().value = value;
    select().dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    current = signal(defaultPreferences());
    save = vi.fn<PreferencesStore['save']>().mockResolvedValue(undefined);
    error = vi.fn<ToastService['error']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: PreferencesStore, useValue: { preferences: current.asReadonly(), save } },
        { provide: ToastService, useValue: { error } },
      ],
    });
    fixture = TestBed.createComponent(ThemeSelector);
    fixture.detectChanges();
  });

  it('offers the three appearances with a label, showing the saved one', () => {
    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('Tema');
    expect([...select().options].map((option) => option.text.trim())).toEqual([
      'Según el sistema',
      'Claro',
      'Oscuro',
    ]);
    expect(select().value).toBe('dark');
  });

  it('saves the chosen appearance keeping the rest of the preferences', async () => {
    await choose('light');

    expect(save).toHaveBeenCalledWith({ ...defaultPreferences(), appearance: 'light' });
  });

  it('follows the stored preference', () => {
    current.set({ ...defaultPreferences(), appearance: 'system' });
    fixture.detectChanges();

    expect(select().value).toBe('system');
  });

  it('tells the failure and goes back to the saved appearance', async () => {
    save.mockRejectedValueOnce(new Error('boom'));

    await choose('light');

    expect(error).toHaveBeenCalledTimes(1);
    expect(select().value).toBe('dark');
  });
});
