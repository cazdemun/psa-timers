import { Timer, TimerMachine, timerMachine, TimerRecord } from './newTimerMachine';
import { ActorRefFrom, assign, createMachine, sendParent, spawn, send } from "xstate";
import { pure } from 'xstate/lib/actions';
import { AlarmName, getAlarm } from '../../services/alarmService';

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
  //
  selectedTimerId: string | undefined
  totalGoal: number
  title: string
  priority?: number
  sound?: AlarmName
  //
  loop: number
  restartWhenDone: boolean
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
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGIDKACgIIDqAcgPoAqAkgLICiASngNoAMAuoqAA4boALpiw8QAD0QBaAKwBGABwA6OTIBMAZnUyNatQHYNAFgA0IAJ7S1ANiNKjRuezUL9a5wpkKAvt7MpYdGwlADMAJzAwJQCgrCU0CAAbMBwiABE0jm4kEH4hETFJBGtrZXZ9OUrXawMjAE4FM0tio2slPXd3Ev0ehR8-EBiRUIiooeCE5JwAMSYAeToKAGEACRoAGTSmBkppmjIaPBXqemYssTy0YWwxZq87BTU5DS16tRl5MyLDNXsFOv0JQ0CjkNRevn8qGG4Ui0ShEySKQAqgQ0kQqAxqHMqER1hQAOJzXHnHKXa6iHJFEplCpVQG1BpNRDyOyKTxeORGF62fQQwbwuIwsYC+KInDbPA4phUCh4Bh4PA0OZkEl8ARXAqUxDUpTlSqKen6eqNCyIIwfJRedheax1eR2zx88aC0ZwwLDSYpbZ0OYANUxtEYTFVuXV5MK2tKutpBpqRsZpoQGjqbQBNg0TjkdWMzydIqFbtioqmqyIZHxAZoVHWDBDZM1oCpUb1dLjxqZSeBSg0tms+hk7AUfbUjjz7uCBedxZSSzm63WRAIcpOQbYXAuYYbEkjNP11QZJuaBjqSn7fds2fYRiNcjHRcnIs9ODmBB2K+Ya+yavyNy1xWbMb7vGh6IHocgqEYfSDnUAKeLad7Qq6ABuaBgAA7tOOBUHM+L4jWso0GkDAkEQACan4bj+FKNma6jdoO7DsCU16aEYBgdpULxKCCrR1JBzwwaUCETshqEYU+2G4fhPpousdabr+NEIH0bSQRUTwGNY6jAhxzwaNxnK2vxyYpv0kLji6sIoehSgALYYBAACGiRYTheGYjJxLrqSCnUduyl0XUTj6DBoKcXUHFMTI7SAsCGjOHI+iDsJllRNZGHoBA6GOeYsCuVJHlzLJ8lURGxRGrqoJGFe-GlBmHEjvo3FPL2Ci6DIRq8gMU4Ful0QJNluX5e5BFESR5ElRqin+fxSgNNYijVf8cXPJFWkxdYcUJUlZn8hZ8RYIIYBhEhzmYS+b6BswFCeXJ3nflNflFFIWiqXxdrXs8kHVTIHbJk1igwY8PY1ZyKUHUdJ1nU+swLMsaybNsuz7IcxxXcG92hqVf5SICJ4ODonKJZBaYdi4bQjmxjX9k8V7g2gh3HadiSYZKRDSu+GNfljj1lbIHW6lpDQgsCzjXhxIUqEOeg2poC1GPTjNQyzwi2cddAOc5OBLOsczLujN1FV53P1tNz2i5aV6bWxzHvKYiatL8ah1Ix1jsD2LwyDBCt8lgDlwGIzqUbzONDtFBMZo4Rr-G4HZSHImhKCULiGFBMHJrtPWjMH4Z-q99EKK7PKsexDttJy1QgjIC1aSU1jgw+Fk51uRTfXNmhuNb7xuyBCB6UnkEi+7duZ-mrpTp6zdm8yujtxonfGN3g4dvczV6TIbwfLe3Vj1ZYlT09ZpXgXRcsYv+gdgoXJJ3xHV1KxBo++Z96iTZk8+djSnqOBmhBX27ubRcL3bM4Eszmn7Fmd6m0G6vwwvZJyiQD5lRdm9Z4m0KjVXeg1a8a9WrtU6jAveNlMqDXgB-EOX8nDtE0BvdQSVSjlAalxD4jwmIphCuUNQitIbMyQaHRK9hzSR2JjHNQccewqBqK4EKqhSgDlHvtBmPDoaIj4UpF6LhuJ2nig4Bwt8Uwr3Ai8Wkhd6hgkeDIbhTMzqq3VprRB5Dc7qOMaecoPRnYfBHG1e2zRAGni8HaZwNDKj118N4IAA */
  
/** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGIDKACgIIDqAcgPoAqAkgLICiASngNoAMAuoqAA4boALpiw8QAD0QBaAKwBGABwA6OTIBMAZnUyNatQHYNAFgA0IAJ7S1ANiNKjRuezUL9a5wpkKAvt7MpYdGwlNCxBMAAnADcAQwAbEIg4sBwAeQIGSlpGJgo6VIARIgAZDm4kEH4hETFJBCkta3sATiNmmSN9OWMFI3YZM0sEDWb9FQVm5oVNa3YHOSNff1QRELDI2IS0JJSAMSZUugoAYQAJGmKCpkyKXZoyGjxT6npmMrEqtGFsWul9a2a9iMOgWcn0RgmbkGiBcTTUDj0nX06iciz8IACQSwa3C0XiiWS+CoRCYVBeOXeFU+31EFTqshkY3Y1hkUwU3QUzk60IQYMBimsei8go01gWSwxK2CoVxmyUwgAtpE6BgIPEcMdiqk8Axycw8oUSpS+AIvjU6dINJylDI5izbYz9M13KYLIg2k05uxmexRRpRb50VhVXAxJjzSbqj8LfUFCygSDHODIWoeVI5JolNZBQpPB1bU7rBLw9L1ni4h9TTTfrGwQmNKDk6NU276qKVDn9E7VNZPOwfOiS9iZRt8dtkpWo7TQPTdMoJjo5g42sDmtYefIlP6uoo5mvNNMZMWpcOy3LFcrVfFJ2bozPLRoxvp2F23O11BDjDzrLolMiF84mjyHIRaBkAA */
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
    tsTypes: {} as import("./newSessionMachine.typegen").Typegen0,
    schema: { context: {} as SessionContext, events: {} as SessionEvent },
    preserveActionOrder: true,
    predictableActionArguments: true,
    on: {
      SPAWN_TIMERS: {
        actions: [
          "spawnTimers",
          "updateTimers"
        ],
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
        }
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
        }
      },
    },
  }, {
    actions: {
      spawnTimers: assign({
        // timersQueue: (_, event) => event.docs.map((timer) => spawn(timerMachine(timer), timer._id)),
        timersQueue: (ctx, event) => event.docs.map((timer) => {
          const existingMachine = ctx.timersQueue.find((process) => process.id === timer._id);
          return existingMachine ?? spawn(timerMachine(timer), timer._id);
        }),
        totalGoal: (_, event) => event.docs.reduce((acc, timer) => acc + timer.millisecondsOriginalGoal, 0),
        currentTimerIdx: (_) => 0,
      }),
      updateTimers: pure((ctx, event) => {
        return event.docs
          .map((timer) => [ctx.timersQueue.find((process) => process.id === timer._id), timer])
          .filter((args): args is [ActorRefFrom<TimerMachine>, Timer] => args[0] !== undefined)
          .map(([existingActor, timer]) => {
            return send({ type: 'UPDATE_TIMER', timer }, { to: existingActor })
          })
        // return send(({ }, {})
        // timersQueue: (_, event) => event.docs.map((timer) => spawn(timerMachine(timer), timer._id)),
        // timersQueue: event.docs.map((timer) => {
        //   const existingMachine = ctx.timersQueue.find((process) => process.id === timer._id);
        //   return existingMachine ?? spawn(timerMachine(timer), timer._id);
        // }),
        // totalGoal: (_, event) => event.docs.reduce((acc, timer) => acc + timer.millisecondsOriginalGoal, 0),
        // currentTimerIdx: (_) => 0,
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
