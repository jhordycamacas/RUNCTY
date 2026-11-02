import { TAB_BAR_PADDING, tabBarContentHeight } from './tabBarLayout';

describe('tabBarContentHeight', () => {
  it('uses the standard 49dp bar for a normal label', () => {
    expect(tabBarContentHeight(16)).toBe(49 + TAB_BAR_PADDING * 2);
  });

  it('grows with larger text so labels are not clipped', () => {
    // 17dp line x 1.5 device text size = 25.5 -> 26dp, 10dp more than the default budget.
    expect(tabBarContentHeight(17 * 1.5)).toBe(49 + 10 + TAB_BAR_PADDING * 2);
  });

  it('never shrinks below the default height for small text', () => {
    expect(tabBarContentHeight(10)).toBe(49 + TAB_BAR_PADDING * 2);
  });
});
