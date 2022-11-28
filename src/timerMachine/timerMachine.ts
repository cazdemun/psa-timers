import { getAlarm } from './../services/alarmService';
import { formatMillisecondsmmss, mmssToMilliseconds } from './../utils';
import { assign, createMachine, sendParent } from "xstate";
import { AlarmName } from '../services/alarmService';

export type Timer = {
  _id: string
  sessionId: string
  millisecondsOriginalGoal: number
  label: string
  sound: AlarmName
  countable: boolean
  created: number
}

export type TimerRecord = {
  _id: string
  sessionId: string
  millisecondsOriginalGoal: number
  finalTime: number
};

export type TimerContext = {
  _id: string
  _sessionId: string
  label: string

  millisecondsOriginalGoal: number
  millisecondsCurrentGoal: number
  millisecondsLeft: number

  initialTime: number
  // rename to finishTimestamp
  finalTime: number | undefined

  millisecondsInput: string
};

export type TimerEvent =
  | { type: 'RESET'; }
  | { type: 'UPDATE'; newMillisecondsGoals: string; }
  | { type: 'START'; newMillisecondsGoals?: number; }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TOOGLE_COLLAPSE' }
  | { type: 'COLLAPSE' }
  | { type: 'OPEN' }


export const timerMachine = (timer: Timer
  // initialGoal: number = 10000, _id: string = Date.now().toString(), _sessionId: string = '',
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMAnAdAYwBsB7PAaxywFcA7a1aqAYgAUBBAVQGUBRAbQAYAuolAAHIrFRoi1ESAAeiAGwB2fjgCsAGhABPRBoCcKgL4mdaTLkIlyVWvSYAlbjwAqA4UhDjJ02d6KCAAcwRo4AEz8AMwAjBGhsQAsSsbROvoI0SoRmmYWGNj4xGQUNHQMjPKwyACGyGA4tQBmDVgAFLH8-ACUjJZFNqX2FVCecr5SqDJyQcHR6tFG2dp6iBEqSfkgA9YlduWOVTX1jS1tnd19u8W2ZQ4MvLFeYhJTM4EGm5GrmbEaW3MO0KezuolqlFgkEYLk47AAsnwhBM3v5ZohYoYkjguoYVhlEEkNLkIhptjchuRwZDobDuB5kd5JmjPghMdjcfi1ggIoZYjglIKhcLBaYgRT9jhUBACGBGJw3KwnAyXj5UdMAqAghpvqSCVl+Co8uKQbdStLZYx2MwACKsNxI1XMjXorLEzRxPXczH8vki-2GcmmgBuqDAAHd8EQCARaqIoRBGG4APLJgDiABluAB9ADCyYzGdYzB44yZ6o+WsQ0SSuX4KWCKl+iDCwWNBSsOFDEZwRFEYGoSdTmZz+cLxdLjNefhdrJrdYbTf1wX4SnbwM73fDjDHRZLjpRM8rCkQOWX8Rw0Sv15vV8BHaKW8YyeY3AAcmXp+9NSeEGfuYYK5mEC1BEBAcByBKdwjI4h7fq6hj8HWnrNggSQqEoQadpSODUgmcEslWf4RPqSjxFhgyShaYAEbORFJMkODBIhShepk0QRLkfr+kKYoPqCZC0ceQQREkpHhN0knoY2SgaPM0QUbgW5RjGcb4eWR4-iJsTpNywQXvJt43veG6PmGkZ9gOQlaQYGjqPWqT8BoGixE2Kj6cuZHrjcW7Wa6on6iork4Ekhhhc5ERKEssTBJhJpWH5rIALQBdyKXRDgYVZUSLmpKFhhxWYQA */
  createMachine({
    context: {
      _id: timer._id,
      _sessionId: timer.sessionId,
      label: timer.label,
      // These variables are needed so
      // Actual start date in unix tstp
      initialTime: Date.now(),
      // The original time a timer was created
      millisecondsOriginalGoal: timer.millisecondsOriginalGoal,
      // The current goal, this gets modified everytime a timer is paused
      millisecondsCurrentGoal: timer.millisecondsOriginalGoal,
      // Time left when timer is running, starts on current goal and goes to zero
      millisecondsLeft: timer.millisecondsOriginalGoal,
      // Bind this to a input on a form
      millisecondsInput: formatMillisecondsmmss(timer.millisecondsOriginalGoal,),
      finalTime: undefined,
    },
    tsTypes: {} as import("./timerMachine.typegen").Typegen0,
    schema: { context: {} as TimerContext, events: {} as TimerEvent },
    predictableActionArguments: true,
    id: "timer",
    type: "parallel",
    states: {
      clock: {
        initial: "idle",
        states: {
          running: {
            after: {
              "100": [
                {
                  target: "#timer.clock.running",
                  cond: (ctx) => ctx.millisecondsLeft > 0,
                  actions: ["updateAfter100Milliseconds"],
                  internal: false,
                },
                {
                  target: "#timer.clock.idle",
                  actions: [
                    "playSound",
                    "setFinishTimestamp",
                    "sendFinishUpdate",
                  ],
                  internal: false,
                },
              ],
            },
            on: {
              PAUSE: {
                target: "paused",
                actions: "pauseTimer",
              },
              RESET: {
                target: "running",
                actions: "resetTimer",
                internal: false,
              },
            },
          },
          paused: {
            on: {
              RESUME: {
                target: "running",
                actions: "resumeTimer",
              },
              RESET: {
                target: "idle",
                actions: "resetTimer",
              },
            },
          },
          idle: {
            on: {
              START: {
                target: "running",
                actions: "startTimer",
              },
              UPDATE: {
                target: "idle",
                actions: ["updateTimerFromInput", "sendInputUpdate"],
                internal: false,
              },
            },
          },
        },
      },
      view: {
        initial: "collapsed",
        states: {
          collapsed: {
            on: {
              TOOGLE_COLLAPSE: {
                target: "open",
              },
            },
          },
          open: {
            on: {
              TOOGLE_COLLAPSE: {
                target: "collapsed",
              },
            },
          },
        },
        on: {
          COLLAPSE: {
            target: ".collapsed",
          },
          OPEN: {
            target: ".open",
          },
        },
      },
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
      updateTimerFromInput: assign((_, event) => ({
        millisecondsLeft: mmssToMilliseconds(event.newMillisecondsGoals),
        millisecondsCurrentGoal: mmssToMilliseconds(event.newMillisecondsGoals),
        millisecondsInput: event.newMillisecondsGoals,
      })),
      startTimer: assign((ctx, event) => ({
        initialTime: Date.now(),
        millisecondsOriginalGoal: event.newMillisecondsGoals ?? ctx.millisecondsCurrentGoal,
        millisecondsCurrentGoal: event.newMillisecondsGoals ?? ctx.millisecondsCurrentGoal,
        millisecondsLeft: event.newMillisecondsGoals ?? ctx.millisecondsCurrentGoal,
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
      setFinishTimestamp: assign((_) => ({
        finalTime: Date.now(),
      })),
      playSound: () => (new Audio(getAlarm(timer.sound))).play(),
      sendFinishUpdate: sendParent((ctx) => ({
        type: 'FROM_CHILDREN_FINISH_TIMER',
        timerId: ctx._id,
        record: {
          finalTime: ctx.finalTime,
          millisecondsOriginalGoal: ctx.millisecondsOriginalGoal,
          sessionId: ctx._sessionId,
        }
      })),
      sendInputUpdate: sendParent((ctx) => ({ type: 'UPDATE_TOTAL_GOAL' })),
    }
  });

export type TimerMachine = typeof timerMachine;