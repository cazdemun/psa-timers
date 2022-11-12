import { TimerMachine, timerMachine, TimerRecord } from './timerMachine';
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
  | { type: 'FROM_CHILDREN_FINISH_TIMER', timerId: string; record: TimerRecord }
  | { type: 'UPDATE_TOTAL_GOAL'; }
  | { type: 'RESTART_SESSION'; }
  | { type: 'REMOVE_TIMER'; timerId: string; }
  | { type: 'CHANGE_TITLE'; title: string; }
  | { type: 'COLLAPSE_TIMERS' }
  | { type: 'OPEN_TIMERS' }
  | { type: 'TOGGLE_SIDEWAYS' }
  | { type: 'TOGGLE_MODAL' }
  | { type: 'TO_FREE_MODE' }
  | { type: 'TO_INTERVAL_MODE' }


export const sessionMachine = (
  _id: string,
  title: string = 'New Timer',
  timers: number[] = [DEFAULT_GOAL],
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYDpYBcBDAJ3wGIBtABgF1FQAHDdfTLekAD0QFoBGABwBOHADYA7ABYAzKL5UATNIUS+CgDQgAnomlVpY6dKF9pfcQoCsayQF9bmlLHTYcAM2JgweVGxxoIABswMgBBABFw6jokECYWNg5uBFFRARwqcT5sgXFRBSkhAU0dFMlRHAUqxSpU8XqBAXtHX1cPLx9nPwDgsgAxAEkAOQGAZQAJAH0AFQGAWQBRACVojni0VmwkxFT0zOzBPILJIpLESwsccSFRa0lMyyK+IWaQJxdcdu937qCQgFUAArhULTBYzADy01CABlJgBxCGw1axdabdixZK7DJZHJHQrFbTnPiSHCCASWSwCElGUSScSvH5tTzfVq4HohJYLUbQpbTSajbmjAYQoYoxjMDaJTE7NI4g65fIEs4ISSUnBUqhU0RCay6imMtnuFmdD7+P5kLlzCEANXBs0WK1oa0l6O2KTl+zxSpOhNKxgqQgsojMVGe0kkpkNXWZHSZ7ItAGFxqEhvD7QNpjCFuK4q7paAsZ7cYcfaciQgjOlZOVxJYqAIJApI9GzV9Tb9eomITCYaFAYKZvNlqNc2iC1xZXsS4rjuXSgURHWJHShHp6S2HG8je34+behDAQshkPHaPnaj81sZR7pwr8b6VVU+GTJI0G0IgxSda2-O2AG5oGAADu+4hNMELwvC2YCgM4QLAA6qEACa54xBKCTXoWiBqgoOB6AIVC1HSFgRgUKrZEYODUuUQhvqYn5pL+sbeIBIFgWQEFQTB1ogjCY5Xhi2EII0FRvlkChqHklhKH6iCUQYNE6vRxg3E0W57gBQGgQAthgECEIEnGQdB4K8ciF4YVKWGTiJMk4CYmSfnwcgMRRtSWJUeTSAIeiSeIDbMZ8JpsaB6AQCBhBaLAxncWZEJ8QJmFCbZEikmGdJUJI9FpGYFHNuI1GSXSuVWFIDIaTuIXaXgASRdFsWmbB8FIahSXWSlyT0Q5jaCPcwg+WY0jubcXkhr5ijmIFlUxsFXjGZMwxgksNqwpMvE5pZebJe62TpS51ISAIkmESSKqSAoIhqlqliyNc8gKEF-hYPgYDEP+hkLX0XLxfB7VujePD0hqCqXfIF1hll50nA5JhmAomTGMd9hblg+lwBwe4ECQ+AujtgMktWciNjIAVZBSkhPoIDlvqItTZBc+rSE9u5GhyeMde6t14UISjBmRlh03JCBUqSx2mNIlgnFY1gsya8YcwDwlvqSvPSPzF2Cw2FHKK+jQIyY8ghuI6ktLNxodKFYGKxOyQyS+SgmBI+ghgojQqmuL7PGqdbPHRNzMzNbbVexekGYENs2ckQi1DgJymMbJJUP7+XA+LJW+WV9Jy5bNXhfV8CXvjwnWFQlRKFLMkBWkmT5VRlLHbUNzXJkj1B3+IfAZHnU4Vl+ENkRqT0koF3iCqAgXWSdFUriBT6G3ZvB143fupLFQEYPJEj+RFYyHrmfHaPtSm9u5toC9b0fRHRecwTt1XLIjal82W-Q2XaQWBPydWERgeLxO44o68D5mIKQsgHrKFUBoCsQNPIUmyB-bKjFKQo1sEAA */
  createMachine({
    context: { _id, title, timersQueue: [], currentTimerIdx: 0, totalGoal: 0 },
    tsTypes: {} as import("./sessionMachine.typegen").Typegen0,
    schema: { context: {} as SessionContext, events: {} as SessionEvent },
    initial: "start",
    id: "session",
    preserveActionOrder: true,
    predictableActionArguments: true,
    states: {
      start: {
        always: {
          target: "interval",
          actions: "spawnFirstTimer",
        },
      },
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
                    actions: "spawnTimer",
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
        initial: 'idle',
        states: {
          idle: {
            on: {
              FROM_CHILDREN_FINISH_TIMER: {
                target: "idle",
                actions: ["advanceCurrentTimerIdx", "sendFinishTimerUpdate", "startNextTimer"],
                internal: false,
              },
            },
          },
          running: {
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
      advanceCurrentTimerIdx: assign({
        currentTimerIdx: (ctx, event) => {
          const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.timerId);
          if (timerIdx === -1) return ctx.currentTimerIdx;
          return (timerIdx + 1) % ctx.timersQueue.length
        },
      }),
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
