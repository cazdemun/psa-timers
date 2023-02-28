import { getAlarm } from '../../services/alarmService';
import { assign, createMachine, sendParent } from "xstate";
import { pure } from 'xstate/lib/actions';
import { Timer, TimerRecord } from '../../models';

export type TimerContext = {
  _id: string
  timer: Timer
  duration: number // milliseconds
  currentDuration: number // milliseconds
  timeLeft: number // milliseconds
  start: number // milliseconds,
  finished: number | undefined // milliseconds
};

export type TimerEvent =
  | { type: 'UPDATE_TIMER'; timer: Timer }
  | { type: 'START'; duration?: number; }
  | { type: 'RESUME' }
  | { type: 'PAUSE' }
  | { type: 'RESET'; }

export type TimerToParentEvent = { type: 'TIMER_FINISHED', timer: Timer; record?: TimerRecord }

export const timerMachine = (timer: Timer) =>
  createMachine({
    context: {
      _id: timer._id,
      timer,
      /**
       * Property `duration` is, a priori, the clone of `timer.duration`.
       * 
       * However, `duration` will increase or decrease if the `growth` factor is enabled.
       * 
       * `currentDuration` is a mirror of duration that will change if the timer is paused.
       * 
       * Both properties should be equal at the start and reset of timer.
       * On runtime, they will diverge only if timer is paused.
      */
      duration: timer.duration,
      currentDuration: timer.duration,
      timeLeft: timer.duration,
      start: 0,
      finished: undefined,
    },
    tsTypes: {} as import("./newTimerMachine.typegen").Typegen0,
    schema: { context: {} as TimerContext, events: {} as TimerEvent },
    preserveActionOrder: true,
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
                  cond: (ctx) => ctx.timeLeft > 0,
                  actions: ["updateAfter100Milliseconds"],
                  internal: false,
                },
                {
                  target: "#timer.clock.idle",
                  actions: [
                    "playSound",
                    "setFinishedValues",
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
                target: "idle",
                actions: "resetTimer",
              },
            },
          },
          paused: {
            on: {
              START: {
                target: "running",
                actions: "resumeTimer",
              },
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
            },
          },
        },
      },
    },
    on: {
      UPDATE_TIMER: {
        actions: 'updateTimer'
      }
    }
  }, {
    actions: {
      updateTimer: assign((ctx, event) => ({
        timer: event.timer,
        duration: event.timer.duration,
        currentDuration: event.timer.duration,
        timeLeft: ctx.timeLeft > event.timer.duration ? event.timer.duration : ctx.timeLeft,
      })),
      updateAfter100Milliseconds: assign((ctx) => ({
        /** 
         * Normally logic would be ctx.timeLeft - 100, since the event should happen every 100 milliseconds
         * 
         * However, events are not always every 100 milliseconds, especially when tabs are inactive and processes run slower
         * 
         * (Date.now() - ctx.start) give us how much time has passed since the timer started, or timePassed
         * 
         * How much is left? currentDuration - timePassed
         * 
         * This way timer does not depend on inactive/lagging browser.
        */
        timeLeft: ctx.currentDuration - (Date.now() - ctx.start),
      })),
      startTimer: assign((ctx, event) => ({
        start: Date.now(),
        duration: event.duration ?? ctx.duration,
        currentDuration: event.duration ?? ctx.duration,
        timeLeft: event.duration ?? ctx.duration,
      })),
      playSound: (ctx) => getAlarm(ctx.timer.sound).play(),
      pauseTimer: assign((ctx) => {
        const timeLeft = ctx.currentDuration - (Date.now() - ctx.start);
        return {
          currentDuration: timeLeft,
          timeLeft: timeLeft,
        }
      }),
      resumeTimer: assign((_) => ({
        start: Date.now(),
      })),
      // Growth logic goes here
      setFinishedValues: assign((ctx) => {
        if (!ctx.timer.growth) {
          return {
            start: 0,
            finished: Date.now(),
            timeLeft: ctx.duration,
          };
        }
        // Negative growth can't be lesser than -1
        const newDuration = ctx.timer.growth.rate > 0 ? ctx.duration * (1 + ctx.timer.growth.rate) : ctx.duration + ctx.duration * ctx.timer.growth.rate;
        const safeDuration = Math.floor(newDuration < 0 ? 0 : newDuration);

        const min = ctx.timer.growth.min;
        const minSafeDuration = min ? (safeDuration < min ? min : safeDuration) : safeDuration;
        const max = ctx.timer.growth.max;
        const maxSafeDuration = max ? (minSafeDuration > max ? max : minSafeDuration) : minSafeDuration;

        return {
          start: 0,
          finished: Date.now(),
          timeLeft: maxSafeDuration,
          duration: maxSafeDuration,
          currentDuration: maxSafeDuration,
        };
      }),
      resetTimer: assign((ctx) => ({
        start: 0,
        currentDuration: ctx.duration,
        timeLeft: ctx.duration,
      })),
      sendFinishUpdate: pure((ctx) => {
        if (ctx.timer.saveRecord)
          return sendParent((ctx) => ({
            type: 'TIMER_FINISHED',
            timer: ctx.timer,
            record: {
              duration: ctx.timer.duration,
              finalDuration: ctx.duration,
              finished: ctx.finished,
              sessionTitle: 'Unknown',
              timerId: ctx.timer._id,
              timerLabel: ctx.timer.label,
            }
          }) as TimerToParentEvent)
        return sendParent((ctx) => ({
          type: 'TIMER_FINISHED',
          timer: ctx.timer,
        }) as TimerToParentEvent)
      }),
    }
  });

export type TimerMachine = typeof timerMachine;
