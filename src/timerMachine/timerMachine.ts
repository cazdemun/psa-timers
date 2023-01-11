import { getAlarm } from './../services/alarmService';
import { formatMillisecondsmmss, mmssToMilliseconds } from './../utils';
import { assign, createMachine, sendParent } from "xstate";
import { AlarmName } from '../services/alarmService';
import { pure } from 'xstate/lib/actions';

export type Timer = {
  _id: string
  sessionId: string
  millisecondsOriginalGoal: number
  label: string
  sound: AlarmName
  countable: boolean
  created: number
  priority?: number
}

export type TimerRecord = {
  _id: string
  // timerId: string
  sessionId: string
  millisecondsOriginalGoal: number
  finalTime: number
};

export type TimerContext = {
  _id: string
  _sessionId: string
  label: string
  sound: AlarmName
  countable: boolean
  priority: number | undefined

  millisecondsOriginalGoal: number
  millisecondsCurrentGoal: number
  millisecondsLeft: number

  initialTime: number
  // rename to finishTimestamp
  // kinda deprecated
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
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMAnAdAYwBsB7PAaxywFcA7a1aqAYgAUBBAVQGUBRAbQAYAuolAAHIrFRoi1ESAAeiAGwB2fjgCsAGhABPRBoCcKgL4mdaTLkIlyVWvSYAlbjwAqA4UhDjJ02d6KCAAcwRo4AEz8AMwAjBGhsQAsSsbROvoI0SoRmmYWGNj4xGQUNHQMjPKwyACGyGA4tQBmDVgAFLH8-ACUjJZFNqX2FVCecr5SqDJyQYYaSTjRRtkqSSpKGhprGYgR2ziGR8dKwfxJFxH5IAPWJXbljlU19Y0tbZ3dfbfFtmUODF4sS8YgkUxmgQMa0iGm6cPh-FiuwQyRUS2iGIxUURYX4wWuPyG5FEtUosEgjBcnHYAFk+EIJmD-LNELFDIsuoZsto9IgkhpcvsCYU7n8SWSKVTuB4Gd5JszISj2ThOdzkRFDLEcEodbq9TrTOYbiLfqVUBACGBGJw3KwnDKQT4mdMAqAgholItNXqkmd9prkdlchphVZTeRzZbGOxmAARVhuemO+UullZDRatkqb2e7rZZFKLURJLHFTRQz8DVJctKUNFABuqDAAHdGABhADyABku6xmDxxnLnRC3cpoktYrEM2dgiWkucdryQh7tTkVGsNv7knXcI2W4wO8xuAA5QegvypxVKcdxKexGdzhdJZFdYvo9lJZIa-bBK5Gn57s2+BEAQBC1KI5IQIwbgdh2ADiXbcAA+p2PZ9gOsrnuCroKIgmJLBowTltEeKPjymQVrkREfl+hg-juOCATgRCiGA1DQbBCHIahvb9kmjIXiOuFZBiBHUSRs7svw5GILiODURctH0dc1BEBAcByLcAnYWmAC00S5Kcs7BGyU7SfMERKMiumTmiKiwt0SSWWsiIJAxRLaQqo4IMW1kJDCcLRNWYQaEFTnufc-yjJ5l7eZROAxPEMkIOstb-iaRI4OKkExUJQQ5AW8QRX8kZgLlOFBJ+izBBWSj7IGES5Dm+q6oaBRhoB5VplOE53g+UnrM+S4bFqGJSec-B1URf7tQ2TZAXgIFgRBkBdYqUSLLe06kQNKjImEaKxGuG51UY27pR183MaxOEpnlBifmJTnREolbTslFbhApVXfoRZhmEAA */
  createMachine({
    context: {
      _id: timer._id,
      _sessionId: timer.sessionId,
      label: timer.label,
      sound: timer.sound,
      countable: timer.countable ?? false,
      priority: timer.priority,
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
      millisecondsInput: formatMillisecondsmmss(timer.millisecondsOriginalGoal),
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
      sendFinishUpdate: pure((ctx) => {
        if (ctx.countable)
          return sendParent((ctx) => ({
            type: 'FROM_CHILDREN_FINISH_TIMER',
            timerId: ctx._id,
            record: {
              finalTime: ctx.finalTime,
              millisecondsOriginalGoal: ctx.millisecondsOriginalGoal,
              sessionId: ctx._sessionId,
            }
          }))
        return sendParent((ctx) => ({
          type: 'FROM_CHILDREN_FINISH_TIMER',
          timerId: ctx._id,
        }))
      }),
      sendInputUpdate: sendParent((ctx) => ({ type: 'UPDATE_TOTAL_GOAL' })),
    }
  });

export type TimerMachine = typeof timerMachine;
