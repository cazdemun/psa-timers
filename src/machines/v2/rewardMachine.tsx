import { assign, createMachine } from 'xstate';
import { getAlarm } from '../../services/alarmService';

const GLOBAL_CONFIG_FACTOR = 'GLOBAL_CONFIG_FACTOR';

function isMobileBrowser() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function mostrarNotificacion(titulo: string, opciones: NotificationOptions) {
  if (isMobileBrowser()) {
    alert(titulo);
  } else if ('Notification' in window) {
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
  | { type: 'RESET_TIMER' }
  | { type: 'CHANGE_FACTOR'; dir: 'up' | 'down' };

/** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMBZAhgYwAtUA7MAOlmQHsAHAdx2ULNQgBswBiAZQBUBBAEq8A+nwDyABQDq-XgGEAEgG0ADAF1EoGlVio0VYlpAAPRAFoA7GQBMNgKwA2G6vsAWVTYCcTgMyWAGhAAT0QbRzcySzdfRwAOLy87AEZVVUdHAF9MoLRMXEISckpaBiYCMgAnAFdiYhIoTkl+AFVuAFExXilZBRUNYx09AyMkUwtrOOSvXzjVS2T3X1SfINCEZy8yR2nFx0tnGzjLe2zcjGx8IlIKanpGZhq6hs5Bdo7RCRk5JTVNMaG+lQhmMZgQbnsZC8rncTkc0NUbgWa0QsUcZHslmWEXSyX2yUsZxAeUuhRuJXu5SqtXqxEaJkojHIOAAZsgwJUABSpVQASk4JIK12KdzKjxpDT+g10QJBYzBdnRqi8iymqjiERsSJR4Oh2y8lksLkxaRsvi8RMFVyKt1KDwqNBw1VgkB4AmEXR6P36-20MpGoMQELIvlU5oSsRms0scR1WPR3mhXjicXsNhjXjclouQptFLFDqdLogr3e7U+3W+fSlAP9wNGoDB5mmNjIcQhSTSK0RbljISDCTI00N6Xjy3C2fy1vJovtZEdztdfCEol4AEksO1BDW-cN64HwY5fFF7F2bKkY6oCfYdWiMVjkr57Br7ElvJPScKyCTKtTnnSmlaDoRHXTdtwGWs9zlRtEAOZIoixexkkfHZoiPW94W2I4IixRJoi8CIP1zG4fz-Wl6UZdkyFZdkuR5fkrTJchSKecidxAQEA3lRBkxvfsEHCOIh2SFM3AcdJjgcIjp2Yi5f1Yl4GWQJlqLZDluTSBicxk785LIyVkl9Di62g8ZwXsSFn1fXxQycdU8J1AlIgst9eyONM4nTaSmN0zBfwXYs3RXECNy3djOP3biECmSFFWs9Je0zLwdSReDQ1TBI3GhBxH28r9SICpd3QrL1qwg3dZQbMzn3gzM7E7I94QSHUTRDZIzXPNNPENZI8rzWcqVYDhOCUfgADkAHFOgAMX4eRunAoyItMsEUNsWYny1fxTyfPj1mODEjiSY4VUzOYshyYltJ8gqi1dN4Pk9KtfnK4yoKqpsWzbCEUzTdrU2SONEhDJ8VRHXwkXfIliCoCA4GMRjhWld6D3MI4hPbV8XCvZVET2iwDtS9I7GJiFPD6mc7XKZHKtRrVVG+rGu1xtxex1BnPAScIIYIo8RMRAkKZFKnmCGsAaa4mCNnRR80mcdspnNdqdRcVsxPamJYSymMhdtSlxX-KAJciqWMiHUNPEzDJ4VVFq0gxVMVWQ5IIXTGzdfzOdCogY2VsQM3ZeJhXHxVHUTtsSxM1PcSDXhXWf19j7YMfBCn2Q2InPQ-j+e2ETUzcPEtWcK9470hS6UTg85mseF7Ah8IPF8I5Af47xIgh9wrxOaYIwu84pxuvTvcrqLq-1OuxJxJuphamYyDDTL1VE2YLWyTIgA */
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

    factor: parseFloat(localStorage.getItem(GLOBAL_CONFIG_FACTOR) ?? '0.8'),

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
            },

            CHANGE_FACTOR: {
              target: "idle",
              internal: true,
              actions: "updateFactor"
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
              actions: "resetStopwatchAndTimer",
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
            },

            RESET_STOPWATCH: {
              target: "#timeMachine.stopwatch.idle",
              actions: "resetStopwatchAndTimer"
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
        stopwatchTime: (ctx) => Math.floor(ctx.timerTime / ctx.factor),
      }),
      pauseTimer: assign({
        timerCommitedTime: (ctx) => Math.floor(ctx.timerCommitedTime + (Date.now() - ctx.timerStartTime)),
        stopwatchTime: (ctx) => Math.floor(ctx.timerTime / ctx.factor),
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
      updateFactor: assign({
        factor: (ctx, event) => {
          const delta = event.dir === 'down' ? -0.05 : 0.05;
          const newFactor = ctx.factor + delta;
          const lowerBoundedFactor = newFactor < 0.1 ? 0.1 : newFactor;
          const upperBoundedFactor = lowerBoundedFactor > 1 ? 1 : lowerBoundedFactor;
          const updatedFactor = Number(upperBoundedFactor.toFixed(2));
          try {
            localStorage.setItem(GLOBAL_CONFIG_FACTOR, updatedFactor.toString());
          } catch (error) {
            console.log('An error occurred while storing the price in local storage:', error);
          }
          return updatedFactor;
        },
      }),
      notifyUser: () => {
        getAlarm('high_pitch_alarm').play();
        mostrarNotificacion('Timer done', {});
      }
    },
    guards: {
      isTimeLeft: (ctx) => ctx.timerTime > 0,
    },
  });

export default rewardMachine;