import { assign, createMachine } from 'xstate';
import { getAlarm } from '../../services/alarmService';

function mostrarNotificacion(titulo: string, opciones: NotificationOptions) {
  if ('Notification' in window) {
    // Comprobamos si las notificaciones están permitidas o si necesitamos pedir permiso al usuario
    if (Notification.permission === 'granted') {
      // Si las notificaciones están permitidas, creamos y mostramos la notificación
      new Notification(titulo, opciones);
    } else if (Notification.permission !== 'denied') {
      // Si las notificaciones no están permitidas ni denegadas, solicitamos permiso al usuario
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Si el permiso es concedido, creamos y mostramos la notificación
          new Notification(titulo, opciones);
        }
      });
    }
  }
}

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

/** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMBZAhgYwAtUA7MAOlmQHsAHAdx2ULNQgBswBiAZQBUBBAEq8A+nwDyABQDq-XgGEAEgG0ADAF1EoGlVio0VYlpAAPRADYAjGUsAWWwGYnD1QCZXADgCcqhwBoQAE9EAFYPMhDfSw9VEJCvEPNXeNsAX1SAtExcQhJySloGJgIyACcAV2JiEihOSX4AVW4AUTFeKVkFFQ1jHT0DIyRTC1UIyKsHENtLLxmHVwDghAcAdlsyJI9zWxWHLy81r230zIxsfCJSCmp6RmYKqprOQWaW0QkZOSU1TSG+-VQhmMZgQljsZFcKym+xCYLCXlWi0QlnMoycrnMU3M+0sTjWJxAWXOuSuBVuxTKlWqxFqJkojHIOAAZsgwKUABSWVSqACUnCJOUu+RuRXuVJqP16ugBQKGINcXnWtisIQcti8Cu5CPMSIQniVIRWrjBrlUaw8YTSGUJZ0FeWuhTuJRoOHKsEgPAEwjaHS+3V+2mlA2ByNxG12sxWFq8Hgxu11O3MZBcFu86rcsLVBIFF3tZNFztd7ogz1ezXe7U+XUlfyDgMGoBBAFowesHJZPNsNXZ1ZYQrrPK4yAkjX2tgrJh5s7bc6SRU6yC63R6+EJRLwAJJYZqCGuB-r1kMIZUOMiHA7bWOohzbXWrdabTbzJLmJzT7Kz8hE0qUx40uqNC0Iibtuu49LWB6yo2iArFYZ67LCuJWGsr53tiGydjsewHOqxzWjmJJfmcP4PNStL0qyZDMqyHJcry-IzoRZDfr+ZF7iA-zBnKiAxv2QSIBi4Rgh4Hi2MkqjmB4RohO+xJCsxxGsU8dLIAyVEsmynLcnyBHySxpESpYAYcXWUHDMecQRNGTixKi3gHLqlhrGMGquLYsYWoOKyyXaVwsUuxaemuwFbju7GcYe3EIB4fYQhi8QuJeipeAmKzWCm8LpskuI+Z+CmYD+AUrl6Fa+tW4H7jKDbmTsQ4rFEqizGC+weP4-EIPVIQRA43gookrWmuY6TWsQVAQHAxi6XkUqQdVzbGmiHZbOqxr2LMfFLC2UZkDFGqqrYEn7Adri5Ux+ZOjNVVHi2STJktXarb2G2IE2sx3XtyRiSECqWKd8nnRSrAcJdXHQaCaoRNyqgotiZquKsHi6k2p67fFMX1cd8wyfhjH-fOFIGTSIORWDuJKvsMY2RqsHJAOirJrYUzQ1CMzeDef15vjzBFRAxNmSCZOQ1DwvC21SwJWQvhpqoImiT1Xgc35xF83NMFhisCFgjeTkno5MQbNEokomJB1Qt5OMfkx+nikTEFXVFMQrBsCRqhiB3zDFdNtozB1ObCMbaorREFYuRaQCrR6O87+1u74niWLqEtS4qMsiY43jDakQA */
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
                actions: ["resetStopwatchAndTimer", "notifyUser"]
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
      notifyUser: () => {
        mostrarNotificacion('Timer done', {});
        getAlarm('high_pitch_alarm').play()
      }
    },
    guards: {
      isTimeLeft: (ctx) => ctx.timerTime > 0,
    },
  });

export default rewardMachine;