import { Timer, TimerMachine, timerMachine, TimerRecord } from './timerMachine';
import { ActorRefFrom, assign, createMachine, sendParent, spawn, send } from "xstate";
import { pure } from 'xstate/lib/actions';
import { trace } from '../utils';
import { AlarmName, getAlarm } from '../services/alarmService';

const DEFAULT_GOAL = 10000; // milliseconds

export type Session = {
  _id: string
  title: string
  timers: number[]
  priority?: number
  sound?: AlarmName
}

export type SessionContext = {
  _id: string
  timersQueue: ActorRefFrom<TimerMachine>[]
  currentTimerIdx: number
  selectedTimerId: string | undefined
  totalGoal: number
  title: string
  loop: number
  restartWhenDone: boolean
  priority?: number
  sound?: AlarmName
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
  | { type: 'FROM_CHILDREN_FINISH_TIMER', timerId: string; record?: TimerRecord }
  // Interval mode
  | { type: 'TO_INTERVAL_MODE' }
  | { type: 'START_TIMER' }
  | { type: 'REQUEST_CREATE_TIMER' }
  | { type: 'FROM_CRUD_DOCS_CREATED'; timer: Timer }
  | { type: 'SPAWN_TIMERS'; docs: Timer[] }
  | { type: 'OPEN_TIMER_MODAL'; timerId: string; }
  | { type: 'CLOSE_TIMER_MODAL' }


export const sessionMachine = (
  _id: string,
  title: string = 'New Timer',
  timers: number[] = [DEFAULT_GOAL],
  sound: AlarmName | undefined
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGIDKACgIIDqAcgPoAqAkgLICiASngNoAMAuoqAA4boALpiw8QAD0QBaAKwBGABwA6OTIBMAZnUyNatQHYNAFgA0IAJ7S1ANiNKjRuezUL9a5wpkKAvt7MpYdGwlADMAJzAwHCoAeQoaMipmADUiABkKOhiAEQYObiQQfiERMUkEKTUlLQBOOQ05Gts5a10NJrNLBFU5FTlDfSNWhQV2dh1ff1QRUIiwJQCgrCU0CAAbKKJs7PyxYrRhbDLEa2tldn05K9drAyMahU6ToaU9d3dT-S+RyZBFmfCkQW02Cqw2OAAYkwYnQKABhAASNDS2SYDEoEISNDwCOo9GYu0K+0OokKXS8dgUanqWnuahk8jM5UMVSMChq+lOGgULU0Gl+-2CgPmguWYKiAFUCNkiElqDEqOkKABxGLpQl8AQHUqFcqnc6Xa6cu4PJ4IeR2RSeLxyIwaDS2fQCkHLYXAwIzcU4NF4RVMKgUPAMPB4GgxMgaopaknHBD6pQXK6KY2DU0WRBGBlKLzjBTWGryAueZ0eoVzd1LFbrKJorLJBh4xhMSPEnWgPVnBOG5O3VOPdMIdrWJQcmwNdiNYz1EuVt2iqvgxFEMjKhu0KhpPJcPbRtsSE6dxNG3v3ftde3KB1DfQydh5tyOGcA8vzr1wmJpNJEAhBxvMNjbkSu5HLqB4GkmNwmmeiAGDUSg3tYnL3Bo7BGIMchPmWQKvtWOAxAQ6J-iwLbAaS7ZgV2EEpqeZp6L0tojHeNQcp4+aYa65YAG5oGAADuC5RLEyrKpugY0LkJBEAAmgBBSaiUIHkQgmZVChozsKcaGaEYBhmlc9pKDyQw1Gy9TMWc7GzEC3F8QJ0QxMJolZDKaQkQpZH7ggIzDmylzUgY1jqNyek0oZtr5qZ7RND4fh-C6VnzDZ-EALYYBAACGaz2Y5DbOeqgHydqimeZ4VR1BczEtPpNR6RpMivJy3IodS+h3pZbpJQsqx8el5iwNlIm5Tk+VyVG7mxohdgTrYqGmWcDR6WoaGGdStjzfSgxOrF84dTx-HoBAPV9QNomhhJ0myTu42gcpPIjnmihGExTX1LVgUNcMzX9G123xWgWCCGAYScZl9kUFCDBDbkblFR55SqNmrUyLYng1NyCgNBotETiOciwVcbIoVoln-YDwOZXZ+GEbQTaZMNrkFWNsOxlIWg+SZBZofUbJPTIZrtPoKjsg8mjWLNtokwDQMg2sdlQjC8JIiiaIYliOJETDMY3VInJwQ4Oi2v0bKjrReavA4ehoTe1KoZLZMy3ZvpEP6GuM62xXlLIMiC3VDw8tyzhoXp+hwYotz0nmosS79pZilL5Oy8IyVA3QaWg3CaQxL+NPMHTLma3unsB9mqGtDpmn0qYA5DFUag1GMYsOvaMjMUYvixVgaVwGIopXcz2t5vV+sNI4gzsm4ZpSHjgunHXS2aZmaFtzHs5zH3WtKWz1R3g3jrabp1dVAxCiZuwzEGNN7Uvi66+FxmJ8jpobhl-SYvQd0DRKCjVKtWyyNaPyFez5sJ-WrLfD2iAdBlSfmOHSyM7xmgpCtGkMg6QMgwkArCiU9rgLhhmVC291KaTcMYA+XQT69Aii3XQt53CAKmLHBKShOrilwbGdQvRNB1EQuwJuLh35o3oiZb2hYOatCvtZPaShUoZTWGwm69d2b1FaJcJ6HNFrLSpC0IYGMNpoQkdg2yB0jrwCAtdJS8h2CvE0Kg9QrUzgXEWgZBkVINJNBDhcNQdtpaZXkUpKQPJBbD0NmPE2A5WbKF5PXe0FxHC2JkN4hOAk-GeVZi4QyBYUIOAcMIjoA55DVA0IaUY9xbjcnpIkh2ScU5pzkWY-u-j7SC1al8NwBZ1CEyrl0VoVQbzsloTYq41h27eCAA */
  createMachine({
    context: {
      _id,
      title,
      timersQueue: [],
      currentTimerIdx: 0,
      totalGoal: 0,
      selectedTimerId: undefined,
      loop: 0,
      restartWhenDone: true,
      sound,
    },
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
              OPEN_TIMER_MODAL: {
                target: "timerModal",
                actions: "saveSelectedTimerId",
              },
              FROM_CHILDREN_FINISH_TIMER: {
                target: "idle",
                actions: [
                  "updateLoop",
                  "advanceCurrentTimerIdx",
                  "sendFinishTimerUpdate",
                  "startNextTimer",
                  "updateTotalGoal",
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
          timerModal: {
            on: {
              CLOSE_TIMER_MODAL: {
                target: "idle",
                actions: "clearSelectedTimerId",
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
        currentTimerIdx: (_) => 0,
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
        currentTimerIdx: (context) => 0,
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
      startTimer: pure((ctx) => {
        if (ctx.sound) (new Audio(getAlarm(ctx.sound))).play();
        return send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] })
      }),
      // startNextTimer: pure((ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined),
      startNextTimer: pure((ctx) => {
        // this prevent bucles
        // if (ctx.currentTimerIdx === 0) return undefined;
        const currentTimer = ctx.timersQueue.at(ctx.currentTimerIdx);
        if (!currentTimer) return undefined;
        const goal = currentTimer.getSnapshot()?.context.millisecondsCurrentGoal ?? 0;
        const newGoal = currentTimer.getSnapshot()?.context.countable && ctx.loop > 0 ? Math.ceil(goal * 1.25) : goal;
        return send({ type: 'START', newMillisecondsGoals: newGoal }, { to: currentTimer });
      }),
      updateLoop: assign((ctx) => {
        const isLastTimer = ctx.currentTimerIdx === ctx.timersQueue.length - 1;
        if (isLastTimer) return { loop: ctx.loop + 1 };
        return { loop: ctx.loop };
      }),
      // startNextTimer: (ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined,
      // startNextTimer: send({ type: 'START' }, { to: (ctx) => ctx.currentTimerIdx !== 0 ? ctx.timersQueue[ctx.currentTimerIdx] : 'undefined' }),
      updateTotalGoal: assign({
        totalGoal: (ctx) => ctx.timersQueue
          .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
          .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
      }),
      saveSelectedTimerId: assign({
        selectedTimerId: (_, event) => event.timerId,
      }),
      clearSelectedTimerId: assign({
        selectedTimerId: (_) => undefined,
      }),
      sendFinishTimerUpdate: pure((_, event) => {
        const record = event.record;
        if (record)
          return sendParent({
            type: 'FROM_CHILDREN_FINISH_TIMER',
            record,
          });
        return undefined;
      }),
      // https://stackoverflow.com/questions/59314563/send-event-to-array-of-child-services-in-xstate
      collapseTimers: pure((context) =>
        context.timersQueue.map((myActor) => send('COLLAPSE', { to: myActor }))
      ),
      openTimers: pure((context) =>
        context.timersQueue.map((myActor) => send('OPEN', { to: myActor }))
      ),
    },
  });
