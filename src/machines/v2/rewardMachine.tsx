import { assign, createMachine } from 'xstate';

interface Context {
  stopwatchStartTime: number
  stopwatchTime: number
  stopwatchCommitedTime: number
  recordedStopwatchTime: number

  factor: number

  timerStartTime: number
  timerGoalTime: number
  timerCommitedTime: number
  timerTime: number
}

type Event =
  | { type: 'START_STOPWATCH' }
  | { type: 'PAUSE_STOPWATCH' }
  | { type: 'RESET_STOPWATCH' }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER' };

/** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMBZAhgYwAtUA7MAOlmQHsAHAdx2ULNQgBswBiAZQBUBBAEq8A+nwDyABQDq-XgGEAEgG0ADAF1EoGlVio0VYlpAAPRADYAjGUsAWWwGYnD1QCZXADgCcqhwBoQAE9EAFYPMhDfSw9VEJCvEPNXeNsAX1SAtExcQhJySloGJgIyACcAV2JiEihOSX4AVW4AUTFeKVkFFQ1jHT0DIyRTC1UIyKsHENtLLxmHVwDghAcAdlsyJI9zWxWHLy81r230zIxsfCJSCmp6RmYKqprOQWaW0QkZOSU1TSG+-VQhmMZgQljsZFcKym+xCYLCXlWi0QlnMoycrnMU3M+0sTjWJxAWXOuSuBVuxTKlWqxFqJkojHIOAAZsgwKUABSWVSqACUnCJOUu+RuRXuVJqP16ugBQKGINcXnWtisIQcti8Cu5CPMSIQniVIRWrjBrlUaw8YTSGUJZ0FeWuhTuJRoOHKsEgPAEwjaHS+3V+2mlA2ByNxG12sxWFq8Hgxu11O3MZBcFu86rcsLVBIFF3tZNFztd7ogz1ezXe7U+XUlfyDgMGoBBAFowesHJZPNsNXZ1ZYQrrPK4yAkjX2tgrJh5s7bc6SRU6yC63R6+EJRLwAJJYZqCGuB-r1kMIZUOMiHA7bWOohzbXWrdabTbzJLmJzT7Kz8hE0qUx40uqNC0Iibtuu49LWB6yo2iArFYZ67LCuJWGsr53tiGydjsewHOqxzWjmJJfmcP4PNStL0qyZDMqyHJcry-IzoRZDfr+ZF7iA-zBnKiAxv2QSIBi4Rgh4Hi2MkqjmB4RohO+xJCsxxGsU8dLIAyVEsmynLcnyBHySxpESpYAYcXWUHDMecQRNGTixKi3gHLqlhrGMGquLYsYWoOKyyXaVwsUuxaemuwFbju7GcYe3EIB4fYQhi8QuJeipeAmKzWCm8LpskuI+Z+CmYD+AUrl6Fa+tW4H7jKDbmTsQ4rFEqizGC+weP4-EIPVIQRA43gookrWmuY6TWsQVAQHAxi6XkUqQdVzbGmiHZbOqxr2LMfFLC2UZkDFGpJNyrhqgqMn4Yx8n5k6M1VUeLZJMmS1dqtvYbYgTazPde17I12J9l4uVMRdFKsBwV1cdBoJqhE3KqCi2JmodUa6k2p67fFMX1bYbjzCdpwfgD84UgZNKg5F4O4kq+wxjZGqwckA6KsmthTDDUIzN4N7-edBPMEVEAk2ZILk1D0MiyLbVLAlZC+GmqgiaJPV-adeN6cR-NzTBYYrAhYI3k5J6OTEGzRFJLhuUzElWrjcn2vp4rExB11RTEKwbAkR3bL4niWPTbZM5jTmwjG2qczbim82rR7O67qpiR78wxbqkvS4qssiY43jDakQA */
const rewardMachine = createMachine({
  id: 'timeMachine',
  preserveActionOrder: true,
  predictableActionArguments: true,
  schema: {
    context: {} as Context,
    events: {} as Event,
  },
  tsTypes: {} as import("./rewardMachine.typegen").Typegen0,
  context: {
    stopwatchStartTime: 0,
    stopwatchTime: 0,
    stopwatchCommitedTime: 0,
    recordedStopwatchTime: 0,

    factor: 0.8,

    timerStartTime: 0,
    timerGoalTime: 0,
    timerCommitedTime: 0,
    timerTime: 0,
  },

  states: {
    stopwatch: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            START_STOPWATCH: {
              actions: 'startStopwatch',
              target: 'running',
            }
          },
        },
        running: {
          after: {
            100: {
              actions: 'incrementStopwatch',
              internal: false,
              target: '#timeMachine.stopwatch.running'
            },
          },
          on: {
            PAUSE_STOPWATCH: {
              target: 'paused',
              actions: "pauseStopwatch"
            },
            RESET_STOPWATCH: {
              target: 'idle',
              actions: 'resetStopwatch',
            },
          },
        },
        paused: {
          on: {
            START_STOPWATCH: {
              target: 'running',
              actions: "startStopwatch"
            },

            RESET_STOPWATCH: {
              target: 'idle',
              actions: 'resetStopwatch',
            },

            START_TIMER: {
              target: "#timeMachine.timer.running",
              actions: "startTimerFromStopwatch"
            }
          },
        },
      },
    },
    timer: {
      states: {
        running: {
          after: {
            100: [
              {
                actions: 'decrementTimer',
                target: "#timeMachine.timer.running",
                internal: false,
                cond: 'isTimeLeft',
              },
              {
                target: "#timeMachine.stopwatch.idle",
                actions: "resetStopwatchAndTimer"
              },
            ],
          },
          on: {
            PAUSE_TIMER: {
              target: 'paused',
              actions: "pauseTimer"
            }
          },
        },

        paused: {
          on: {
            START_TIMER: {
              target: 'running',
              actions: "startTimer"
            },

            START_STOPWATCH: {
              target: "#timeMachine.stopwatch.running",
              actions: "startStopwatchFromTimer"
            }
          },
        }
      }
    },
  },

  initial: "stopwatch"
},
  {
    actions: {
      startStopwatch: assign({
        stopwatchStartTime: (_) => Date.now(),
      }),
      startStopwatchFromTimer: assign({
        stopwatchStartTime: (_) => Date.now(),
        stopwatchCommitedTime: (ctx) => ctx.stopwatchTime,
      }),
      incrementStopwatch: assign({
        stopwatchTime: (ctx) => ctx.stopwatchCommitedTime + (Date.now() - ctx.stopwatchStartTime),
        timerGoalTime: (ctx) => Math.floor(ctx.stopwatchTime * ctx.factor),
        timerTime: (ctx) => Math.floor(ctx.stopwatchTime * ctx.factor),
      }),
      pauseStopwatch: assign({
        stopwatchCommitedTime: (ctx) => ctx.stopwatchCommitedTime + (Date.now() - ctx.stopwatchStartTime),
      }),
      resetStopwatch: assign({
        stopwatchStartTime: (_) => 0,
        stopwatchTime: (_) => 0,
        stopwatchCommitedTime: (_) => 0,
        recordedStopwatchTime: (_) => 0,
      }),
      ///////////
      startTimerFromStopwatch: assign({
        timerStartTime: (_) => Date.now(),
        timerGoalTime: (ctx) => Math.floor(ctx.stopwatchTime * ctx.factor),
        timerTime: (ctx) => Math.floor(ctx.stopwatchTime * ctx.factor),
        timerCommitedTime: (_) => 0,
        recordedStopwatchTime: (ctx) => ctx.stopwatchTime,
      }),
      startTimer: assign({
        timerStartTime: (_) => Date.now(),
      }),
      decrementTimer: assign({
        timerTime: (ctx) => Math.max(Math.floor(ctx.timerGoalTime - (Date.now() - ctx.timerStartTime) - ctx.timerCommitedTime), 0),
        stopwatchTime: (ctx) => Math.floor(ctx.timerTime / 0.9),
      }),
      pauseTimer: assign({
        timerCommitedTime: (ctx) => Math.floor(ctx.timerCommitedTime + (Date.now() - ctx.timerStartTime)),
        stopwatchTime: (ctx) => Math.floor(ctx.timerTime / 0.9),
      }),
      resetStopwatchAndTimer: assign({
        stopwatchStartTime: (_) => 0,
        stopwatchTime: (_) => 0,
        stopwatchCommitedTime: (_) => 0,
        recordedStopwatchTime: (_) => 0,

        timerStartTime: (_) => 0,
        timerGoalTime: (_) => 0,
        timerCommitedTime: (_) => 0,
        timerTime: (_) => 0,
      }),
    },
    guards: {
      isTimeLeft: (ctx) => ctx.timerTime > 0,
    },
  });

export default rewardMachine;