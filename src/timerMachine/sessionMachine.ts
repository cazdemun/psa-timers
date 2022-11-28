import { Timer, TimerMachine, timerMachine, TimerRecord } from './timerMachine';
import { ActorRefFrom, assign, createMachine, sendParent, spawn, send } from "xstate";
import { pure } from 'xstate/lib/actions';
import { trace } from '../utils';

const DEFAULT_GOAL = 10000; // milliseconds

export type Session = {
  _id: string
  title: string
  timers: number[]
  priority?: number
}

export type SessionContext = {
  _id: string
  timersQueue: ActorRefFrom<TimerMachine>[]
  currentTimerIdx: number
  totalGoal: number
  title: string
  priority?: number
};

export type SessionEvent =
  | { type: 'ADD'; }
  | { type: 'UPDATE_TOTAL_GOAL'; }
  | { type: 'RESTART_SESSION'; }
  | { type: 'REMOVE_TIMER'; timerId: string; }
  | { type: 'CHANGE_TITLE'; title: string; }
  | { type: 'COLLAPSE_TIMERS' }
  | { type: 'OPEN_TIMERS' }
  | { type: 'TOGGLE_SIDEWAYS' }
  | { type: 'TOGGLE_MODAL' }
  | { type: 'TO_FREE_MODE' }
  | { type: 'FROM_CHILDREN_FINISH_TIMER', timerId: string; record: TimerRecord }
  // Interval mode
  | { type: 'TO_INTERVAL_MODE' }
  | { type: 'START_TIMER' }
  | { type: 'REQUEST_CREATE_TIMER' }
  | { type: 'FROM_CRUD_DOCS_CREATED'; timer: Timer }
  | { type: 'SPAWN_TIMERS'; docs: Timer[] }


export const sessionMachine = (
  _id: string,
  title: string = 'New Timer',
  timers: number[] = [DEFAULT_GOAL],
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGIDKACgIIDqAcgPoAqAkgLICiASngNoAMAuoqAA4boALpiw8QAD0QBaAKwBmAIwA6dgDYZAFgAcAJgDsC9ux0KANCACe0hVoCcSzdr1zVduTPZyAvl-MpY6NhKAGYATmBgOFQA8hQ0ZFTMAGpEADIUdNEAIgwc3Egg-EIiYpIIhnIOOloyMlrsCjoNWhoa5lblOjJKOrYK-RrVcnLstXo+fqgiIeFgSv6BWEpoEAA2kURZWXliRWjC2KWIqq4qBv1aeqr6GrZa7ccaqj06TU0nep9aWhMgC9NhCLzKZBFbrHAAMSY0ToFAAwgAJGipLJMBiUCHxGh4BHUejMHYFPYHUQFDp1DRKXQKYaaWxdGRmCSIZw6JTaWxXVRyLQKa7DX7-IKAuZCpZgyIAVQIWSIiWo0SoaQoAHFomlCXwBPsSgUyictGd+jYrjc7g8EIzKTYanUFBphqoNONfH8QUsRcCAtMJTg0XglUwqBQ8Aw8HgaNEyJrCtqSUcEAajRdTXpbvdLIgNLUHPU6qpbIzCzVBe6ZkCxcs1pE0Zkkgw8YwmDHibrQPrTuxzibrmnzZmEHJbM9OTpuYYFLY5BoaaXvcLZl7FlXwYiiGQVQ3aFRUrkuLs423mYnO93Lr30xbhoaXE89B4tKo9DoZ3Pl57K764dFUqkiARQ0bZg2H3IlD0OPVjlPY1zzNDMOn0ex7yfJ0p3YZ1X1dSsPzLX1ogIdEgJYFtwNJdsoMNLsYNTS8B1eZR7W+dg7E5GoCzfAFFwANzQMAAHcV0iGIVRVXcQxoHISCIABNED8i1YoIPIhBszZEZ6jUJ1n2nfQLX6YYqXtAttBpWxhx+LCy09Hj+MEqJohEsTMllVISMUsjj2+Z4nEaRorhkHQeT0mlKl5J5bBModzI4hcgRsgSAFsMAgABDVZ7MchtnI1UCFJ1JTPICpQ+i7My+X02w9LUbp9G5LQRhMPRmJij1uN4gT0AgfiUosWAMtErLshy+TY3chMn0pBonXQkzXEUPSXz0KkTCdOaujTF1JnnVq4va+YVm63r+rEiNJJkuSDzGyCVN5YrHxsDRmKneqaSq9QeiuHkGoUJqLK25c0CwQQwFCLi0vsigoQYQacjc-KPLKXz2TqQLAr5Porj0C0mmUPpEIGerPG0FrliBkGwdWOyoRheEkRRNEMSxHEiLh+NrtkWx2CUVR0PkfpAs8Gxsdubn+ZpJjXCdEnAeB0G0rsgMiCDFnctG+GEyke0uYin7Pj0Tm1HvbGrhUJ1hlR1QaRkTkfFdLBkrgMQxUu9X2cl7necURoRkUeDpGdJR3F8iLdAdZ1vEs7byzAF22eU9xnnUowTmdQLBixgdBiURi9Hqa5qsw-7OIrd1Y6PMptEpek5GfblBhkHm-fKRRuacEP2HpWoZBJnCo4lMuCrKeQ2Wr2udIb5iLQpZaQrpBkFB7tr+IHhGs3QwPmOTrS090gcWmUYzrZqZ8xx+xfdts-uwKu5SAuUQK+ifTxuWqJupwYiKZHvScIuHCOi9inMeKSgkqpVWCvBMnNvJ9BcDXLWv8FoB2pKteq61nTnyAXtTqh14DX1drfQwLx3CqSaq4LsC0DK1F0GoYc+suw6GlmTOW4C8Fx2PFIOqHtsxewFr7C0z52SNBaKxRkltVCMNlhTQSED2YCyUAYXmtRYGeDqHpS2xUhHck5DXbktsvBAA */
  createMachine({
  context: { _id, title, timersQueue: [], currentTimerIdx: 0, totalGoal: 0 },
  tsTypes: {} as import("./sessionMachine.typegen").Typegen0,
  schema: { context: {} as SessionContext, events: {} as SessionEvent },
  preserveActionOrder: true,
  predictableActionArguments: true,
  on: {
    SPAWN_TIMERS: {
      actions: "spawnTimers",
    },
  },
  initial: "interval",
  id: "session",
  states: {
    free: {
      type: "parallel",
      states: {
        session: {
          initial: "idle",
          states: {
            idle: {
              on: {
                ADD: {
                  target: "idle",
                  internal: false,
                },
                FROM_CHILDREN_FINISH_TIMER: {
                  target: "idle",
                  actions: ["advanceCurrentTimerIdx", "sendFinishTimerUpdate"],
                  internal: false,
                },
                UPDATE_TOTAL_GOAL: {
                  target: "idle",
                  actions: "updateTotalGoal",
                  internal: false,
                },
                RESTART_SESSION: {
                  target: "idle",
                  actions: "restartSession",
                  internal: false,
                },
                REMOVE_TIMER: {
                  target: "idle",
                  actions: "removeTimer",
                  internal: false,
                },
                CHANGE_TITLE: {
                  target: "idle",
                  actions: "updateTitle",
                  internal: false,
                },
                COLLAPSE_TIMERS: {
                  target: "idle",
                  actions: "collapseTimers",
                  internal: false,
                },
                OPEN_TIMERS: {
                  target: "idle",
                  actions: "openTimers",
                  internal: false,
                },
              },
            },
          },
        },
        view: {
          initial: "idle",
          states: {
            idle: {
              on: {
                TOGGLE_SIDEWAYS: {
                  target: "sideways",
                },
                TOGGLE_MODAL: {
                  target: "modal",
                },
              },
            },
            modal: {
              on: {
                TOGGLE_MODAL: {
                  target: "idle",
                },
              },
            },
            sideways: {
              on: {
                TOGGLE_MODAL: {
                  target: "modal",
                },
                TOGGLE_SIDEWAYS: {
                  target: "idle",
                },
              },
            },
          },
        },
      },
      on: {
        TO_INTERVAL_MODE: {
          target: "interval",
        },
      },
    },
    interval: {
      initial: "idle",
      states: {
        idle: {
          on: {
            FROM_CHILDREN_FINISH_TIMER: {
              target: "idle",
              actions: [
                "advanceCurrentTimerIdx",
                "sendFinishTimerUpdate",
                "startNextTimer",
              ],
              internal: false,
            },
            START_TIMER: {
              target: "idle",
              actions: "startTimer",
              internal: false,
            },
          },
        },
      },
      on: {
        TO_FREE_MODE: {
          target: "free",
        },
      },
    },
  },
}, {
    actions: {
      spawnTimers: assign({
        timersQueue: (_, event) => trace(event.docs).map((timer) => spawn(timerMachine(timer), timer._id)),
        totalGoal: (_, event) => event.docs.reduce((acc, timer) => acc + timer.millisecondsOriginalGoal, 0),
      }),
      // spawnFirstTimer: assign({
      //   timersQueue: (ctx) => {
      //     const preTimerId = Date.now();
      //     return timers.map((d, i) => {
      //       const timerId = (preTimerId + i).toString();
      //       const oldTimer: Timer = {
      //         _id: timerId,
      //         sessionId: ctx._id,
      //         millisecondsOriginalGoal: d,
      //         label: 'New timer',
      //         sound: 'old_alarm',
      //         countable: true,
      //       }
      //       return spawn(timerMachine(oldTimer), timerId,);
      //     })
      //   },
      //   totalGoal: (_) => timers.reduce((acc, x) => x + acc, 0),
      // }),
      // spawnNewTimer: assign({
      //   timersQueue: (ctx, event) => [...ctx.timersQueue, spawn(timerMachine(event.timer), event.timer._id)],
      //   totalGoal: (ctx, event) => ctx.totalGoal + event.timer.millisecondsOriginalGoal,
      // }),
      // spawnTimer: assign({
      //   timersQueue: (ctx) => {
      //     const timerId = Date.now().toString();
      //     const newTimer: Timer = {
      //       _id: timerId,
      //       sessionId: ctx._id,
      //       millisecondsOriginalGoal: 10000,
      //       label: 'New timer',
      //       sound: 'alarm',
      //       countable: true,
      //     }
      //     return [...ctx.timersQueue, spawn(timerMachine(newTimer), timerId)]
      //   },
      //   totalGoal: (ctx) => ctx.totalGoal + DEFAULT_GOAL,
      // }),
      restartSession: assign({
        currentTimerIdx: (_) => 0,
      }),
      updateTitle: assign({
        title: (_, event) => event.title,
      }),
      removeTimer: assign((ctx, event) => {
        const newTimersQueue = ctx.timersQueue.filter((t) => t.id !== event.timerId)
        const currentTimerId = ctx.timersQueue[ctx.currentTimerIdx].id;
        const removedTimerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.timerId);
        const potentialCurrentTimerIdx = newTimersQueue.map((e) => e.id).indexOf(currentTimerId);
        // if -1 it means we removed the current one, so the newCurrenTimer should be
        // the next one, i.e. it is mantained (or 0 if it was the last one)
        const newCurrentTimerIdx = potentialCurrentTimerIdx !== -1
          ? potentialCurrentTimerIdx
          // 0 % 0 NaN default
          : ((removedTimerIdx % newTimersQueue.length) || 0);
        return {
          timersQueue: newTimersQueue,
          totalGoal: newTimersQueue
            .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
            .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
          currentTimerIdx: newCurrentTimerIdx,
        }
      }),
      advanceCurrentTimerIdx: assign({
        currentTimerIdx: (ctx, event) => {
          const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.timerId);
          if (timerIdx === -1) return ctx.currentTimerIdx;
          return (timerIdx + 1) % ctx.timersQueue.length
        },
      }),
      startTimer: send({ type: 'START' }, { to: (ctx) => ctx.timersQueue[ctx.currentTimerIdx] }),
      startNextTimer: pure((ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined),
      // startNextTimer: (ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined,
      // startNextTimer: send({ type: 'START' }, { to: (ctx) => ctx.currentTimerIdx !== 0 ? ctx.timersQueue[ctx.currentTimerIdx] : 'undefined' }),
      updateTotalGoal: assign({
        totalGoal: (ctx) => ctx.timersQueue
          .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
          .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
      }),
      sendFinishTimerUpdate: sendParent((_, event) => ({
        type: 'FROM_CHILDREN_FINISH_TIMER',
        record: event.record
      })),
      // https://stackoverflow.com/questions/59314563/send-event-to-array-of-child-services-in-xstate
      collapseTimers: pure((context) =>
        context.timersQueue.map((myActor) => send('COLLAPSE', { to: myActor }))
      ),
      openTimers: pure((context) =>
        context.timersQueue.map((myActor) => send('OPEN', { to: myActor }))
      ),
    },
  });
