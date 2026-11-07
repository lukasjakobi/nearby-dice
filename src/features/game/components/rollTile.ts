import { RADIUS, SIZE } from '@/ui';

/**
 * The roll tile's shape, shared by the slider and the tap button. The "pick a field" hint and the
 * score confirmation keep its height, so the bar does not jump. One touch target high.
 */
export const ROLL_TILE_HEIGHT = SIZE.touch;
export const ROLL_TILE_RADIUS = RADIUS.rollTile;
