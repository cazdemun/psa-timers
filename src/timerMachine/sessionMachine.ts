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
  | { type: 'UPDATE_TOTAL_GOAL'; }
  | { type: 'RESTART_SESSION'; }
  | { type: 'REMOVE_TIMER'; timerId: string; }


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
        'RESTART_SESSION': {
          target: 'idle',
          actions: 'restartSession',
        },
        'REMOVE_TIMER': {
          target: 'idle',
          actions: 'removeTimer',
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
    restartSession: assign({
      currentTimerIdx: (_) => 0,
    }),
    removeTimer: assign((ctx, event) => {
      const newTimersQueue = ctx.timersQueue.filter((t) => t.id !== event.timerId)
      const currentTimerId = ctx.timersQueue[ctx.currentTimerIdx].id;
      const removedTimerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.timerId);
      const potentialCurrentTimerIdx = newTimersQueue.map((e) => e.id).indexOf(currentTimerId);
      // if -1 it means we removed the current one, so the newCurrenTimer should be
      // the next one, i.e. it is mantained (or 0 if it was the last one)
      const newCurrentTimerIdx = potentialCurrentTimerIdx !== -1
        ? potentialCurrentTimerIdx
        // 0 % 0 NaN default
        : ((removedTimerIdx % newTimersQueue.length) || 0);
      return {
        timersQueue: newTimersQueue,
        totalGoal: newTimersQueue
          .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
          .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
        currentTimerIdx: newCurrentTimerIdx,
      }
    }),
    advanceCurrentTime: assign({
      currentTimerIdx: (ctx, event) => {
        const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.id);
        if (timerIdx === -1) return ctx.currentTimerIdx;
        return (timerIdx + 1) % ctx.timersQueue.length
      },
    }),
    updateTotalGoal: assign({
      totalGoal: (ctx) => ctx.timersQueue
        .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
        .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
    }),
  },
});
