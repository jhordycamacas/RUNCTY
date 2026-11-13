import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;

  const run = (dirty: boolean) => {
    const screen: HasUnsavedChanges = { hasUnsavedChanges: () => dirty };
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => unsavedChangesGuard(screen, route, state, state));
  };

  beforeEach(() => {
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmDialog, useValue: { confirm } }],
    });
  });

  it('lets the user leave a screen without changes, without asking', () => {
    expect(run(false)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before leaving with unsaved changes and follows the answer', async () => {
    expect(await run(true)).toBe(true);
    expect(confirm).toHaveBeenCalledOnce();

    confirm.mockResolvedValueOnce(false);
    expect(await run(true)).toBe(false);
  });
});
