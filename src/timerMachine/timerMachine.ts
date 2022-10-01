import { assign, createMachine } from "xstate";

export type CronContext = {
  initialTime: number
  millisecondsOriginalGoal: number
  millisecondsCurrentGoal: number
  millisecondsLeft: number
};

export type CronEvent =
  | { type: 'RESET'; }
  | { type: 'UPDATE'; newMillisecondsGoals: number; }
  | { type: 'START'; newMillisecondsGoals: number; }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }


export const timerMachine = (initialGoal: number) => createMachine({
  initial: 'idle',
  tsTypes: {} as import("./timerMachine.typegen").Typegen0,
  schema: { context: {} as CronContext, events: {} as CronEvent },
  context: {
    // These variables are needed so 
    // Actual start date in unix tstp
    initialTime: Date.now(),
    // The original time a timer was created
    millisecondsOriginalGoal: initialGoal,
    // The current goal, this gets modified everytime a timer is paused
    millisecondsCurrentGoal: initialGoal,
    // Time left when timer is running, starts on current goal and goes to zero
    millisecondsLeft: initialGoal,
  },
  states: {
    running: {
      after: {
        100: [
          {
            target: 'running',
            // This is just assuming no real beggining would start on 1970
            cond: (ctx) => ctx.millisecondsLeft > 0,
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
        RESET: {
          target: 'running',
          actions: 'resetTimer',
        },
      }
    },
    paused: {
      on: {
        RESUME: {
          target: 'running',
          actions: 'resumeTimer', // update initialTime
        },
        RESET: {
          target: 'idle',
          actions: 'resetTimer',
        },
      }
    },
    idle: {
      on: {
        START: {
          target: 'running',
          actions: 'startTimer',
        },
        UPDATE: {
          target: 'idle',
          actions: 'updateTimer',
        },
      }
    }
  },
}, {
  actions: {
    updateAfter100Milliseconds: assign((ctx) => ({
      // This way this doesn't depend on inactive/lagging browser
      millisecondsLeft: ctx.millisecondsCurrentGoal - (Date.now() - ctx.initialTime),
    })),
    resetTimer: assign((ctx) => ({
      initialTime: Date.now(),
      millisecondsCurrentGoal: ctx.millisecondsOriginalGoal,
      millisecondsLeft: ctx.millisecondsOriginalGoal,
    })),
    updateTimer: assign((_, event) => ({
      initialTime: Date.now(),
      millisecondsCurrentGoal: event.newMillisecondsGoals,
      millisecondsLeft: event.newMillisecondsGoals,
    })),
    startTimer: assign((_, event) => ({
      initialTime: Date.now(),
      millisecondsOriginalGoal: event.newMillisecondsGoals, 
      millisecondsCurrentGoal: event.newMillisecondsGoals,
      millisecondsLeft: event.newMillisecondsGoals,
    })),
    resumeTimer: assign((_) => ({
      initialTime: Date.now(),
    })),
    pauseTimer: assign((ctx) => {
      const millisecondsLeft = ctx.millisecondsCurrentGoal - (Date.now() - ctx.initialTime);
      return {
        millisecondsCurrentGoal: millisecondsLeft,
        millisecondsLeft: millisecondsLeft,
      }
    }),
  }
});
