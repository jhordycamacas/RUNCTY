import { MIN_TOUCH_TARGET } from '@/core/theme';

export const TAB_BAR_PADDING = 4;
/** react-navigation's default bar budgets 49dp for a 24dp icon plus a ~16dp label. */
const DEFAULT_TAB_CONTENT_HEIGHT = 49;
const DEFAULT_LABEL_LINE_HEIGHT = 16;

/**
 * Height of the tab bar without the bottom inset. It grows with the rendered
 * label line height (app font preference x device text size), so labels are
 * never clipped, and it never drops below the 48dp touch target.
 */
export function tabBarContentHeight(renderedLabelLineHeight: number): number {
  const extra = Math.max(0, Math.ceil(renderedLabelLineHeight) - DEFAULT_LABEL_LINE_HEIGHT);
  return Math.max(MIN_TOUCH_TARGET, DEFAULT_TAB_CONTENT_HEIGHT + extra) + TAB_BAR_PADDING * 2;
}
