import { assign, createMachine } from "xstate";

export type CronContext = {
  initialTime: number
  initialMilliSeconds: number
  milliSecondsLeft: number
};

export type CronEvent =
  | { type: 'RESET'; initialMilliSeconds: number; }
  | { type: 'UPDATE'; initialMilliSeconds: number; }
  | { type: 'START'; initialMilliSeconds: number; }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }


export const timerMachine = (initialMilliSeconds: number) => createMachine({
  initial: 'idle',
  tsTypes: {} as import("./timerMachine.typegen").Typegen0,
  schema: { context: {} as CronContext, events: {} as CronEvent },
  context: {
    // Actual start date in unix tstp
    initialTime: 0,
    initialMilliSeconds: initialMilliSeconds,
    milliSecondsLeft: initialMilliSeconds,
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
            target: 'idle',
          },
        ]
      },
      on: {
        PAUSE: {
          target: 'paused',
          actions: 'pauseTimer',  // update initialMilliseconds and millisecondsLeft
        },
      }
    },
    paused: {
      on: {
        RESUME: {
          target: 'running',
          actions: 'resumeTimer', // update initialTime
        },
      }
    },
    idle: {
      on: {
        START: {
          target: 'running',
          actions: 'resetTimer',
        },
        UPDATE: {
          target: 'idle',
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
    resumeTimer: assign((_) => ({
      initialTime: Date.now(),
    })),
    pauseTimer: assign((ctx) => {
      const milliSecondsLeft = ctx.initialMilliSeconds - (Date.now() - ctx.initialTime);
      return {
        initialMilliSeconds: milliSecondsLeft,
        milliSecondsLeft: milliSecondsLeft,
      }
    }),
  }
});
