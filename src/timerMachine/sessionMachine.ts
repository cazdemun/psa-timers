import { TimerMachine, timerMachine } from './timerMachine';
import { ActorRefFrom, assign, createMachine, spawn } from "xstate";

export type CronContext = {
  timersQueue: ActorRefFrom<TimerMachine>[],
  currentTimer: number,
};

export type CronEvent =
  | { type: 'ADD'; }


export const sessionMachine = createMachine({
  initial: 'start',
  tsTypes: {} as import("./sessionMachine.typegen").Typegen0,
  schema: { context: {} as CronContext, events: {} as CronEvent },
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
        }
      }
    }
  },
}, {
  actions: {
    spawnFirstTimer: assign({
      timersQueue: (_) => [spawn(timerMachine())]
    }),
    spawnTimer: assign({
      timersQueue: (ctx) => [...ctx.timersQueue, spawn(timerMachine())]
    })
  },
});
