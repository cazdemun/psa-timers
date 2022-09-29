import { assign, createMachine } from "xstate";
import { trace } from "../utils";

export type CronContext = {
  initialTime: number
  initialMilliSeconds: number
  milliSecondsLeft: number
};

export type CronEvent =
  | { type: 'RESET'; initialMilliSeconds: number; }
  | { type: 'START'; initialMilliSeconds: number; }


export const timerMachine = createMachine({
  initial: 'paused',
  tsTypes: {} as import("./timerMachine.typegen").Typegen0,
  schema: { context: {} as CronContext, events: {} as CronEvent },
  context: {
    // Actual start date in unix tstp
    initialTime: 0,
    initialMilliSeconds: 0,
    milliSecondsLeft: 0,
  },
  states: {
    running: {
      after: {
        100: [
          {
            target: 'running',
            // This is just assuming no real beggining would start on 1970
            cond: (ctx) => ctx.milliSecondsLeft > 0,
            actions: 'updateAfter100Milliseconds',
          },
          {
            target: 'paused',
          },
        ]
      },
    },
    paused: {
      on: {
        START: {
          target: 'running',
          actions: 'resetTimer',
        },
      }
    }
  },
  on: {
    RESET: {
      target: 'running',
      actions: 'resetTimer',
    },
  },
}, {
  actions: {
    updateAfter100Milliseconds: assign((ctx) => ({
      // This way this doesn't depend on inactive/lagging browser
      milliSecondsLeft: ctx.initialMilliSeconds - (Date.now() - ctx.initialTime),
    })),
    resetTimer: assign((_, event) => ({
      initialTime: Date.now(),
      initialMilliSeconds: event.initialMilliSeconds,
      milliSecondsLeft: event.initialMilliSeconds,
    })),
  }
});
