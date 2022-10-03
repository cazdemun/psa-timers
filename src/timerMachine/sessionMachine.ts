import { TimerMachine, timerMachine } from './timerMachine';
import { ActorRefFrom, assign, createMachine, spawn } from "xstate";

const DEFAULT_GOAL = 10000; // milliseconds

export type SessionContext = {
  timersQueue: ActorRefFrom<TimerMachine>[],
  currentTimerIdx: number,
  totalGoal: number,
};

export type SessionEvent =
  | { type: 'ADD'; }
  | { type: 'FINISH_TIMER', id: string; }
  | { type: 'UPDATE_TOTAL_GOAL', }


export const sessionMachine = createMachine({
  initial: 'start',
  tsTypes: {} as import("./sessionMachine.typegen").Typegen0,
  schema: { context: {} as SessionContext, events: {} as SessionEvent },
  context: {
    timersQueue: [],
    currentTimerIdx: 0,
    totalGoal: 0,
  },
  states: {
    start: {
      always: {
        target: 'idle',
        actions: 'spawnFirstTimer'
      },
    },
    idle: {
      on: {
        'ADD': {
          target: 'idle',
          actions: 'spawnTimer',
        },
        'FINISH_TIMER': {
          target: 'idle',
          actions: 'advanceCurrentTime',
        },
        'UPDATE_TOTAL_GOAL': {
          target: 'idle',
          actions: 'updateTotalGoal',
        },
      }
    }
  },
}, {
  actions: {
    spawnFirstTimer: assign({
      timersQueue: (_) => {
        const timerId = Date.now().toString();
        return [spawn(timerMachine(DEFAULT_GOAL, timerId), timerId)];
      },
      totalGoal: (_) => DEFAULT_GOAL,
    }),
    spawnTimer: assign({
      timersQueue: (ctx) => {
        const timerId = Date.now().toString();
        return [...ctx.timersQueue, spawn(timerMachine(DEFAULT_GOAL, timerId), timerId)]
      },
      totalGoal: (ctx) => ctx.totalGoal + DEFAULT_GOAL,
    }),
    advanceCurrentTime: assign({
      currentTimerIdx: (ctx, event) => {
        const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.id);
        if (timerIdx === -1) return ctx.currentTimerIdx;
        return (timerIdx + 1) % ctx.timersQueue.length
      },
    }),
    updateTotalGoal: assign({
      totalGoal: (ctx) => ctx.timersQueue.map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal).reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
    }),
  },
});
