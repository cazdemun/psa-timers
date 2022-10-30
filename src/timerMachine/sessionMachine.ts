import { TimerMachine, timerMachine, TimerRecord } from './timerMachine';
import { ActorRefFrom, assign, createMachine, sendParent, spawn, send } from "xstate";
import { pure } from 'xstate/lib/actions';

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
  | { type: 'FINISH_TIMER', id: string; record: TimerRecord }
  | { type: 'UPDATE_TOTAL_GOAL'; }
  | { type: 'RESTART_SESSION'; }
  | { type: 'REMOVE_TIMER'; timerId: string; }
  | { type: 'CHANGE_TITLE'; title: string; }
  | { type: 'COLLAPSE_TIMERS' }
  | { type: 'OPEN_TIMERS' }
  | { type: 'TOGGLE_SIDEWAYS' }
  | { type: 'TOGGLE_MODAL' }


export const sessionMachine = (
  _id: string,
  title: string = 'New Timer',
  timers: number[] = [DEFAULT_GOAL],
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOljllwHt8yAXdAJzoGIBtABgF1FQAHKpTrV8vEAE9EARgAcANhIclHKXIAsAVjlSAzDoDsMgDQgAHtJn6SOgJxqdU-XIBMcmxofOAvl5NoseISk5LCUNCS4EAA2YCwAggAiCZw8SCACQiJi5giyVrb2ji5uHlLOJpIIzjIaJPocNs4ccjLOaobaPn4YOATEZBQiEdGxAGIAkgBy4wDKABIA+gAq4wCyAKIASiliGbjCNNkW+XYOTq7unhWIOjUkarK2+lI2OvYy7V0g-r1BA6FDSIxFgAVQACgk4kt1ssAPJLOIAGQWAHFYUidmk9gdRGkcnlrKcihdSuUJNJboplKpNNo9IYvj9Av0QmFaEDYpt1jMEZslgsZtyZuNYZNMfxBPssnjjoTCucSldyQgNA0SC83B8PO12s1GT1mcFBuEOSwuatYQA1GErDbbbi7SU4o65Sxys7FS5la4IGwcKlKGlaXQGGT6gJ9I0Ak0jFgAYTmcUmKJt4yWiPW4vSTuloHxboKHpJSsqamcAZU6mD9LDvm+Bsj-zZw2BcdhiMRcTBguWay2Myz2NzZllheJiu9yrkHBkJD92n0aj9ehs7nDvxZxvZsdhYPWk17doHDqxOcOMtdJ3lntJPoAtLVV6uZDoNO85C5nN460zGwA3XAwAAdxbWIllhFEUQzAVxgSdYAHU4gATWPVIJUyc880QB9Z30HQVA0PDXFaJobB9KQVFnL8OB0ZwDA4NQaI0WtugjP4AOA0CWHAyDoItSFEUHM9cSwhBaJsEg5E8GQX10aipB9Zc52qB4VHcadZHXQ0SA4kDUCoCB0CibiIKgmF+IxE90KlTCR1yOQrDsJoSleOxCP0RS3DnJdAxkOTCi0-9AJAygIGA9BxFgEzePM2EBKEjCRLs8TJM8bVNBsfR9DJSoyjKe4ZFeB59A0F4OCywL2OCshInCyLorMmC4MQlCEpspKcjvKQpDqVonA+ZpXnK8iZwkmwpDUdRVw4DRmLsHw63wAy4DEX8-lZIZYAYZhHUSl0OHI+QKyDOlQ0qzdo23GJdva-afTORQKIY8aGictRzqjNkbudC87zUYxlTvOw5yfLRysaVRqg+nTqo5b7h3xR93GKstuqkldFJo5SPmcc5GjonRod0kh9MMqJ4dsnJXwkwqWnGzKFw0Ea9EUIjqkXfCCaJ6rQrq+BTz2i81DnfRMvpvQZAYpccukZx8v+orHFKv1F254CKY67CKIUPCCKIlpqIByo-MfapbFKTLFxY+s2OIDWXS6t86nwqRCNog2miNrWXxBp8Xx8jQ5bkBavCAA */
  createMachine({
  context: { _id, title, timersQueue: [], currentTimerIdx: 0, totalGoal: 0 },
  tsTypes: {} as import("./sessionMachine.typegen").Typegen0,
  schema: { context: {} as SessionContext, events: {} as SessionEvent },
  type: "parallel",
  id: "(machine)",
  states: {
    session: {
      initial: "start",
      states: {
        start: {
          always: {
            target: "idle",
            actions: "spawnFirstTimer",
          },
        },
        idle: {
          on: {
            ADD: {
              target: "idle",
              actions: "spawnTimer",
              internal: false,
            },
            FINISH_TIMER: {
              target: "idle",
              actions: ["advanceCurrentTime", "sendFinishTimerUpdate"],
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
}, {
    actions: {
      spawnFirstTimer: assign({
        timersQueue: (ctx) => {
          const preTimerId = Date.now();
          return timers.map((d, i) => {
            const timerId = (preTimerId + i).toString();
            return spawn(timerMachine(d, timerId, ctx._id), timerId,);
          })
        },
        totalGoal: (_) => timers.reduce((acc, x) => x + acc, 0),
      }),
      spawnTimer: assign({
        timersQueue: (ctx) => {
          const timerId = Date.now().toString();
          return [...ctx.timersQueue, spawn(timerMachine(DEFAULT_GOAL, timerId, ctx._id), timerId)]
        },
        totalGoal: (ctx) => ctx.totalGoal + DEFAULT_GOAL,
      }),
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
      advanceCurrentTime: assign({
        currentTimerIdx: (ctx, event) => {
          const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.id);
          if (timerIdx === -1) return ctx.currentTimerIdx;
          return (timerIdx + 1) % ctx.timersQueue.length
        },
      }),
      updateTotalGoal: assign({
        totalGoal: (ctx) => ctx.timersQueue
          .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
          .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
      }),
      sendFinishTimerUpdate: sendParent((_, event) => ({
        type: 'FINISH_TIMER',
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
