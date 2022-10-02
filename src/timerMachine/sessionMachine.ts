import { TimerMachine, timerMachine } from './timerMachine';
import { ActorRefFrom, assign, createMachine, spawn } from "xstate";

export type SessionContext = {
  timersQueue: ActorRefFrom<TimerMachine>[],
  currentTimer: number,
};

export type SessionEvent =
  | { type: 'ADD'; }
  | { type: 'FINISH_TIMER', id: string; }


export const sessionMachine = createMachine({
  initial: 'start',
  tsTypes: {} as import("./sessionMachine.typegen").Typegen0,
  schema: { context: {} as SessionContext, events: {} as SessionEvent },
  context: {
    timersQueue: [],
    currentTimer: 0,
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
        }
      }
    }
  },
}, {
  actions: {
    spawnFirstTimer: assign({
      timersQueue: (_) => {
        const timerId = Date.now().toString();
        return [spawn(timerMachine(10000, timerId), timerId)];
      },
    }),
    spawnTimer: assign({
      timersQueue: (ctx) => {
        const timerId = Date.now().toString();
        return [...ctx.timersQueue, spawn(timerMachine(10000, timerId), timerId)]
      },
    }),
    advanceCurrentTime: assign({
      currentTimer: (ctx, event) => {
        const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.id);
        if (timerIdx === -1) return ctx.currentTimer;
        return (timerIdx + 1) % ctx.timersQueue.length
      },
    })
  },
});
