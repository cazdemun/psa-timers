import { assign, createMachine } from 'xstate';
import { getAlarm } from '../../services/alarmService';

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

/** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMBZAhgYwAtUA7MAOlmQHsAHAdx2ULNQgBswBiAZQBUBBAEq8A+nwDyABQDq-XgGEAEgG0ADAF1EoGlVio0VYlpAAPRAFoA7GQBMNgKwA2G6vsAWVTYCcTgMyWAGhAAT0QbRzcySzdfRwAOLy87AEZVVUdHAF9MoLRMXEISckpaBiYCMgAnAFdiYhIoTkl+AFVuAFExXilZBRUNYx09AyMkUwtrOOSvXw9fNIz7Wft7INCEezjVMjjHL2SnS2cbOKPs3IxsfCJSCmp6RmYauobOQXaO0QkZOSU1TTGQ30qEMxjMCDc9jIXlc7icezSbksyTWiFijjI9ksvmSEXSuORlnOIDyV0KtxKD3KVVq9WIjRMlEY5BwADNkGBKgAKVKqACUnFJBRuxXuZSetIa-0GumBoLG4LsGNU+02qV2bhsSNREJhZD2lksLixaRsvi8xKF1yKd1KjwqNBw1VgkB4AmEXR6v36AO0spGYMQkLI83NeOSRs16UcOviNkxbhhXjicXsNksCTclsuwptlPFDqdLogbw+7S+3R+fWlgP9INGoHB5mScXjcampzxvl8cR1bgSZGmhocdnc2NT2fy1opYvtZEdztdfCEol4AEksO1BDW-cN64GIY5fFFE14jv3wqpYm4df5Is5didfOFwt3J2SRWRSZUaS96U1Wg6ER103bcBlrPd5UbRAjmSKJsXsZJkliCM3CPW89n1E4ImxRJoi8CJ31zW5v1-OkGSZDkyDZDluV5AUrXJchSOecidxAIEAwVRBk1WEIwniQcWziTV7HSU4HCI6dmMuH9WNeRlkGZaj2U5Hk0gYnNpK-WSyKlZJfQ4usoPGCEVkxVMZnmJxVASM8dVQzF7CSLVW1TE50ykpidMwH8F2LN0V2Ajct3Yzj924hApihJVnPmCJMy8PtkRDWzNi8RNPEQ3wvM-Uj-KXd0Ky9atwN3OUG1MpF40sK9Un2JDEjiXwdVqqElgSXEnGalwshyEktO8-M51YDhOCUfgADkAHFOgAMX4eRujAwzwpM8FkIxM1mrTGJLDE3wVh1U5MROJJTn2DKtj6-riCoCA4GMRiRRlSDKqbdM4n1NyW3PK8ex1cwTqRVIkQSeIjR8XK81ncpXoqg9zDNbZ21+rsAf4hBtk8TNVDcJEln2rEInsaGZztalRrAeGuOghAMkHeZ0hOftkP2GwdRceNNWSLVDshRMMzJ0UKYlP8oBpiK6YZ5DTQyjI9gOXtMbE7ZNmcpCkMhdM33656YdFwtFwgSX1sQGWmbQg5ogOWJWsSWxLAysSHBVI4LT1wa8tk033pg5D4MOpCUOidDMZbFHhPcXEtWcVRkmFnzOT0+lfYPLZrD2JZNS7E4UUx7xImWDwI0Q5MZj6i4p28-Ki0gNPIoz-UfFmcI5jznU4rIK9cZTESew97IgA */
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
          return Number(upperBoundedFactor.toFixed(2));
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