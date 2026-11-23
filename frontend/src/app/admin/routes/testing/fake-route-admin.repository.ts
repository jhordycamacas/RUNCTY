import { vi } from 'vitest';
import { Route } from '../../../routes/domain/route';
import { route } from '../../../routes/domain/testing/fixtures';
import { ManagedRouteDetail, RouteAdminRepository } from '../domain/managed-route';

/** Every port method as a mock, answering an empty aggregate unless a test says otherwise. */
export function fakeRouteAdminRepository() {
  return {
    list: vi.fn<RouteAdminRepository['list']>().mockResolvedValue([]),
    get: vi.fn<RouteAdminRepository['get']>().mockResolvedValue(managedDetail(route('r1'))),
    createRoute: vi.fn<RouteAdminRepository['createRoute']>().mockResolvedValue('new-id'),
    updateRoute: vi.fn<RouteAdminRepository['updateRoute']>().mockResolvedValue(undefined),
    deleteRoute: vi.fn<RouteAdminRepository['deleteRoute']>().mockResolvedValue(undefined),
    setImage: vi.fn<RouteAdminRepository['setImage']>().mockResolvedValue(undefined),
    removeImage: vi.fn<RouteAdminRepository['removeImage']>().mockResolvedValue(undefined),
    createSegment: vi.fn<RouteAdminRepository['createSegment']>().mockResolvedValue('new-id'),
    updateSegment: vi.fn<RouteAdminRepository['updateSegment']>().mockResolvedValue(undefined),
    deleteSegment: vi.fn<RouteAdminRepository['deleteSegment']>().mockResolvedValue(undefined),
    createTimeSlot: vi.fn<RouteAdminRepository['createTimeSlot']>().mockResolvedValue('new-id'),
    updateTimeSlot: vi.fn<RouteAdminRepository['updateTimeSlot']>().mockResolvedValue(undefined),
    deleteTimeSlot: vi.fn<RouteAdminRepository['deleteTimeSlot']>().mockResolvedValue(undefined),
    createRiskFactor: vi.fn<RouteAdminRepository['createRiskFactor']>().mockResolvedValue('new-id'),
    updateRiskFactor: vi
      .fn<RouteAdminRepository['updateRiskFactor']>()
      .mockResolvedValue(undefined),
    deleteRiskFactor: vi
      .fn<RouteAdminRepository['deleteRiskFactor']>()
      .mockResolvedValue(undefined),
  };
}

export type FakeRouteAdminRepository = ReturnType<typeof fakeRouteAdminRepository>;

export const managedDetail = (
  base: Route,
  overrides: Partial<Omit<ManagedRouteDetail, 'route'>> = {},
): ManagedRouteDetail => ({ route: base, segments: [], timeSlots: [], ...overrides });

/** Lets pending promises and the renders they trigger settle. */
export async function settle(fixture: { detectChanges(): void }): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}
