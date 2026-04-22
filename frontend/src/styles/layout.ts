/**
 * AeroEquip Layout Constants
 *
 * All layout magic numbers centralized here.
 * When any structural dimension changes, update here ONLY.
 */

export const LAYOUT = {
  /** Sidebar width */
  SIDEBAR_WIDTH: 200,

  /** Ant Design Header height */
  HEADER_HEIGHT: 64,

  /** Ant Design Tabs bar height (with small size) */
  TAB_BAR_HEIGHT: 46,

  /** Content area margin (AppLayout Content) */
  CONTENT_MARGIN: 16,

  /** Content area padding (AppLayout Content) */
  CONTENT_PADDING: 24,

  /** Right panel width (all professional views) */
  RIGHT_PANEL_WIDTH: 280,

  /** Default gap between flex items */
  GAP: {
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 24,
  },

  /** Drawer widths */
  DRAWER_WIDTH: 480,

  /** Max content width for centered pages (dashboard) */
  MAX_CONTENT_WIDTH: 1200,
} as const;

/**
 * Calculated heights — derived from constants above.
 *
 * Page content area = 100vh - HEADER_HEIGHT - 2 * CONTENT_MARGIN
 *   = 100vh - 64 - 32 = 100vh - 96px
 *
 * Tab content area = page content - CONTENT_PADDING*2 - TAB_BAR_HEIGHT
 *   = 100vh - 96 - 48 - 46 = 100vh - 190px (approx)
 */
export const HEIGHTS = {
  /** Full page content (inside AppLayout Content, minus header and margins) */
  PAGE_CONTENT: 'calc(100vh - 96px)',

  /** Tab content area (inside a Tab, minus header + content padding + tab bar) */
  TAB_CONTENT: 'calc(100vh - 190px)',

  /** Table scroll area (tab content minus stats row + banner ≈ 80px) */
  TABLE_SCROLL: 'calc(100vh - 300px)',
} as const;

/**
 * Status colors used across the platform.
 */
export const STATUS_COLORS = {
  PASS: '#34C759',
  WARNING: '#FF9500',
  BLOCKED: '#FF3B30',
  INFO: '#007AFF',
  MUTED: '#8E8E93',
} as const;
