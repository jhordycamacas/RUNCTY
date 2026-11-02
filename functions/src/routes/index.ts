/**
 * Routes, segments and safety index domain (RF-05, RF-07-1..11). Every write
 * goes through these callables (firestore.rules deny client writes), so
 * validation, ordering and the safety recalculation stay server-side.
 */
export {
  createRiskFactor,
  createRoute,
  createSegment,
  createTimeSlot,
  deleteRiskFactor,
  deleteRoute,
  deleteSegment,
  deleteTimeSlot,
  updateRiskFactor,
  updateRoute,
  updateSegment,
  updateTimeSlot,
} from './routeCallables';
