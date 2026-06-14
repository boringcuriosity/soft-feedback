/**
 * Public surface of the headless behavioral engine.
 *
 * Everything here is pure logic + DOM-event wiring — no rendering, no styling.
 */

export { hash01 } from './hash';

export { createBus } from './bus';

export { buildContext, getAnonId } from './context';

export { evaluateConditions } from './conditions';

export { inSchedule, currentIteration } from './schedule';

export { createFrequencyManager } from './frequency';
export type { FrequencyManager } from './frequency';

export { nps, csat, ces, dsat, pmf, scoreForMetric } from './scoring';

export { watchDomTrigger } from './triggers';

export { createEngine } from './manager';
export type { Engine, EngineDeps } from './manager';
