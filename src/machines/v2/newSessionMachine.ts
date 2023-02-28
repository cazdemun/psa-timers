import { TimerMachine } from './newTimerMachine';
import { ActorRefFrom, assign, createMachine, sendParent } from "xstate";
import { pure } from 'xstate/lib/actions';
import { AlarmName, getAlarm } from '../../services/alarmService';
import { Session, Timer, TimerRecord } from '../../models';

export type SessionContext = {
  session: Session
  currentTimerId: string | undefined,
  selectedTimer: Timer | undefined
  //
  _id: string
  timersQueue: ActorRefFrom<TimerMachine>[] // deprected
  currentTimerIdx: number
  //
  title: string // deprected
  priority?: number // deprected
  sound?: AlarmName // deprecated
  //
  totalGoal: number
  loop: number
  firstStart: boolean,
  restartWhenDone: boolean
};

export type SessionToParentEvent =
  | { type: 'START_TIMER'; timerId: string; }
  | { type: 'RESET_TIMER'; timerId: string; }

export type SessionEvent =
  | { type: 'TIMER_FINISHED'; timerId: string; }
  | { type: 'UPDATE_SESSION'; session: Session; }
  | { type: 'OPEN_STATISTICS'; }
  | { type: 'CLOSE_STATISTICS'; }
  | { type: 'OPEN_TIMER_MODAL'; timer: Timer; }
  | { type: 'CLOSE_TIMER_MODAL' }
  //
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
  | { type: 'CLEAR' }
  | { type: 'REQUEST_CREATE_TIMER' }
  | { type: 'FROM_CRUD_DOCS_CREATED'; timer: Timer }
  | { type: 'SPAWN_TIMERS'; docs: Timer[] }
  | { type: 'TOGGLE_RESTART_WHEN_DONE'; }



export const sessionMachine = (
  session: Session,
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGICqACgCICCAKgKID6AyhTTQJIDyAcgNoAMAuoqAA4Z0AF0xY+IAJ6IAtACYAbHIB0AVgA0IAB6JVcgCzKF+zktUBfc5pSx02ZWizCwAJwBuAQwA2DiF7A4ZMwA4sEAMtQASvRkJJFkVADqABIUrFREbBRcvEgggiJiEjoIMgCcCsoA7AAcpnK1+g2mAMz6mtIINQCMNcpyBt1VqgrdQ5xVVZbWqGIOTq6ePmh+AcwEaVRkjACyFJFUO8ykYTkSBWii2MWyLS3dyi11DT1jBvrtUohjCmVGnN0lE1FC1JnJpiAbHYsPNnO5vL5-DgAGKRZg7KgAYWSjDCRGi6WRjFYjBoyS2u32ZzyFyu4jyJRkVQ+jxarWGVUUqkmHW+nFUfQUqgFClF+jG+gUEKhc0ccKWiICNFi8Qpe0i1IEQkuRQZslU92UZVU3Xu3QN3Jqel5CGND1UZVqCjBNTkjvBVkhs3scsWCJWSO26qoRJJZIoRE1+W1dJupQq1TqSkazQUbRtZQayn0zKGIzGVQmU09Mp9C3hy1WgUpB1DpNSke6uS1hWueoQcmFyldVRaIom+hqNUdNt+LUeQ0zih6fbG0u9MN9FcV1eDdfDkbkzejrfpoEZCdq9RThbTn06ShUndqZW6xuBgPntll5YVAYCmIicSjtN1+9kh5Ji8TSnumXwINyhjXsOd6qA+UolgusJ+pWSLrJsyrkKS2yYjQP4xn+2iyN04pqOakxppeOaijawyqNUgzDKM4yTE+0LIcuogALauDsGAQN4OCfswdBqvshzHCQpw8OcBFtv+pR9vRTxlI6NT6MKwoGDa3TTtmJqFgMbputybEvvKCKwMIHiiFZaAAMawEJYQidQmHbMqjC4fhu5xjIJHKQZvS6epZR3LRvT9Jat73gMj4Qlg-FwBIpZ7juOryURpTqZwrLstyXI8uBLSqVFVRlPUcicBpLSimZZYWV4sm+e2TKZnlaYcoVVQ2oOlQcsOFU1L2oJCvVi6vv6qzNRlaWMmy45Hsm6mpmBnSuotg7DKp5rCsa40cQq3G8fx3gzbGrX3CoDpshUfZspww06SY9HjA6VXDh8zIHUuCpWTZaB2Y552ESUumGJwamOk09y-FU3Q2ht1RbQ6t6aftljmEAA */
  createMachine({
    context: {
      session,
      _id: session._id,
      currentTimerId: undefined,
      selectedTimer: undefined,
      ////
      title: session.title,
      timersQueue: [],
      currentTimerIdx: 0,
      totalGoal: 0,
      loop: 0,
      firstStart: true,
      restartWhenDone: true,
      sound: session.sound,
    },
    tsTypes: {} as import("./newSessionMachine.typegen").Typegen0,
    schema: { context: {} as SessionContext, events: {} as SessionEvent },
    preserveActionOrder: true,
    predictableActionArguments: true,
    on: {
      UPDATE_SESSION: {
        actions: 'updateSession'
      }
    },
    initial: "interval",
    id: "session",
    states: {
      interval: {
        initial: "idle",

        states: {
          idle: {
            on: {
              TOGGLE_RESTART_WHEN_DONE: {
                target: "idle",
                actions: [
                  "updateRestartWhenDone",
                ],
                internal: true,
              },
              OPEN_TIMER_MODAL: {
                target: "timerModal",
                actions: "saveSelectedTimerId",
              },

              FROM_CHILDREN_FINISH_TIMER: {
                target: "idle",
                actions: [
                  "updateLoop",
                  "advanceCurrentTimerId",
                  "advanceCurrentTimerIdx",
                  "sendFinishTimerUpdate",
                  "startNextTimer",
                  "updateTotalGoal",
                ],
                internal: false,
              },

              START_TIMER: {
                target: "idle",
                actions: [
                  "safeUpdateSelectedTimer",
                  "playSessionSound",
                  "disableFirstStart",
                  "startTimer",
                ],
                internal: false,
              },

              TIMER_FINISHED: [
                {
                  target: "idle",
                  cond: 'isLastTimerAndIsDoesNotRepeat',
                  actions: [
                    "advanceCurrentTimerId",
                    "safeUpdateSelectedTimer",
                    "updateLoop",
                  ],
                  internal: false,
                },
                {
                  target: "idle",
                  cond: 'isLastTimerAndIsDoesRepeat',
                  actions: [
                    "advanceCurrentTimerId",
                    "safeUpdateSelectedTimer",
                    "startTimer",
                    "updateLoop",
                  ],
                  internal: false,
                },
                {
                  target: "idle",
                  actions: [
                    "advanceCurrentTimerId",
                    "safeUpdateSelectedTimer",
                    "startTimer",
                  ],
                  internal: false,
                },
              ],
              CLEAR: {
                target: "idle",
                actions: [
                  "enableFirstStart",
                  "resetTimer",
                  "resetSelectedTimerId",
                ],
                internal: false,
              },

              OPEN_STATISTICS: "statistics"
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

          statistics: {
            on: {
              CLOSE_STATISTICS: "idle"
            }
          }
        }
      }
    },
  }, {
    guards: {
      isLastTimerAndIsDoesNotRepeat: (ctx) => {
        return ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === ctx.session.timers.length - 1
          && ctx.restartWhenDone === false
      },
      isLastTimerAndIsDoesRepeat: (ctx) => {
        return ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === ctx.session.timers.length - 1
          && ctx.restartWhenDone === true
      },
    },
    actions: {
      // spawnTimers: assign({
      //   // timersQueue: (_, event) => event.docs.map((timer) => spawn(timerMachine(timer), timer._id)),
      //   timersQueue: (ctx, event) => event.docs.map((timer) => {
      //     const existingMachine = ctx.timersQueue.find((process) => process.id === timer._id);
      //     return existingMachine ?? spawn(timerMachine(timer), timer._id);
      //   }),
      //   // totalGoal: (_, event) => event.docs.reduce((acc, timer) => acc + timer.millisecondsOriginalGoal, 0),
      //   currentTimerIdx: (_) => 0,
      // }),
      // updateTimers: pure((ctx, event) => {
      // return event.docs
      //   .map((timer) => [ctx.timersQueue.find((process) => process.id === timer._id), timer])
      //   .filter((args): args is [ActorRefFrom<TimerMachine>, Timer] => args[0] !== undefined)
      //   .map(([existingActor, timer]) => {
      //     return send({ type: 'UPDATE_TIMER', timer }, { to: existingActor })
      //   })
      // return send(({ }, {})
      // timersQueue: (_, event) => event.docs.map((timer) => spawn(timerMachine(timer), timer._id)),
      // timersQueue: event.docs.map((timer) => {
      //   const existingMachine = ctx.timersQueue.find((process) => process.id === timer._id);
      //   return existingMachine ?? spawn(timerMachine(timer), timer._id);
      // }),
      // totalGoal: (_, event) => event.docs.reduce((acc, timer) => acc + timer.millisecondsOriginalGoal, 0),
      // currentTimerIdx: (_) => 0,
      // }),
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
      // restartSession: assign({
      //   // currentTimerIdx: (context) => 0,
      // }),
      // updateTitle: assign({
      //   title: (_, event) => event.title,
      // }),
      updateSession: assign({
        session: (_, event) => event.session,
      }),
      enableFirstStart: assign({
        firstStart: (_) => true,
      }),
      disableFirstStart: assign({
        firstStart: (_) => false,
      }),
      updateLoop: assign({
        loop: (ctx) => ctx.loop + 1,
      }),
      // removeTimer: assign((ctx, event) => {
      //   const newTimersQueue = ctx.timersQueue.filter((t) => t.id !== event.timerId)
      //   const currentTimerId = ctx.timersQueue[ctx.currentTimerIdx].id;
      //   const removedTimerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.timerId);
      //   const potentialCurrentTimerIdx = newTimersQueue.map((e) => e.id).indexOf(currentTimerId);
      //   // if -1 it means we removed the current one, so the newCurrenTimer should be
      //   // the next one, i.e. it is mantained (or 0 if it was the last one)
      //   const newCurrentTimerIdx = potentialCurrentTimerIdx !== -1
      //     ? potentialCurrentTimerIdx
      //     // 0 % 0 NaN default
      //     : ((removedTimerIdx % newTimersQueue.length) || 0);
      //   return {
      //     timersQueue: newTimersQueue,
      //     // totalGoal: newTimersQueue
      //     //   .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
      //     //   .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
      //     currentTimerIdx: newCurrentTimerIdx,
      //   }
      // }),
      // advanceCurrentTimerIdx: assign({
      //   currentTimerIdx: (ctx, event) => {
      //     const timerIdx = ctx.timersQueue.map((e) => e.id).indexOf(event.timerId);
      //     if (timerIdx === -1) return ctx.currentTimerIdx;
      //     return (timerIdx + 1) % ctx.timersQueue.length
      //   },
      // }),
      advanceCurrentTimerId: assign({
        currentTimerId: (ctx, _) => {
          if (ctx.currentTimerId === undefined) return undefined;
          const timerIdx = ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId);
          if (timerIdx === -1) return undefined;
          return ctx.session.timers.at((timerIdx + 1) % ctx.session.timers.length);
        },
      }),
      playSessionSound: (ctx) => {
        if (
          ctx.session.sound
          && ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === 0
          && ctx.firstStart
        ) getAlarm(ctx.session.sound).play();
      },
      safeUpdateSelectedTimer: assign({
        currentTimerId: (ctx) => {
          if (ctx.session.timers.length === 0) return undefined;
          if (ctx.currentTimerId === undefined) return ctx.session.timers.at(0);
          if (ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === -1) return ctx.session.timers.at(0);
          return ctx.currentTimerId;
        }
      }),
      startTimer: pure((ctx) => {
        if (ctx.session.timers.length === 0) return undefined;
        // if (
        //   // ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === ctx.session.timers.length - 1
        //   ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === 0
        //   && ctx.restartWhenDone === false
        // ) return undefined;
        // if (ctx.currentTimerId === undefined) return send({ type: 'START_TIMER', timerId: ctx.session.timers.at(0) } as SessionToParentEvent);
        // if (ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === -1) return sendParent({ type: 'START_TIMER', timerId: ctx.session.timers.at(0) } as SessionToParentEvent);
        return sendParent({ type: 'START_TIMER', timerId: ctx.currentTimerId } as SessionToParentEvent);
      }),
      resetSelectedTimerId: assign({
        currentTimerId: (ctx) => {
          return ctx.session.timers.at(0);
        }
      }),
      resetTimer: pure((ctx) => {
        if (ctx.session.timers.length === 0) return undefined;
        // if (ctx.currentTimerId === undefined) return send({ type: 'START_TIMER', timerId: ctx.session.timers.at(0) } as SessionToParentEvent);
        // if (ctx.session.timers.findIndex((_id) => _id === ctx.currentTimerId) === -1) return sendParent({ type: 'START_TIMER', timerId: ctx.session.timers.at(0) } as SessionToParentEvent);
        return sendParent({ type: 'RESET_TIMER', timerId: ctx.currentTimerId } as SessionToParentEvent);
      }),
      // startNextTimer: pure((ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined),
      startNextTimer: pure((ctx) => {
        // this prevent bucles
        // if (ctx.currentTimerIdx === 0) return undefined;
        const currentTimer = ctx.timersQueue.at(ctx.currentTimerIdx);
        if (!currentTimer) return undefined;
        // const goal = currentTimer.getSnapshot()?.context.millisecondsCurrentGoal ?? 0;
        // const newGoal = currentTimer.getSnapshot()?.context.countable && ctx.loop > 0 ? Math.ceil(goal * 1.25) : goal;
        // return send({ type: 'START', newMillisecondsGoals: newGoal }, { to: currentTimer });
      }),
      // updateLoop: assign((ctx) => {
      //   const isLastTimer = ctx.currentTimerIdx === ctx.timersQueue.length - 1;
      //   if (isLastTimer) return { loop: ctx.loop + 1 };
      //   return { loop: ctx.loop };
      // }),
      // startNextTimer: (ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined,
      // startNextTimer: send({ type: 'START' }, { to: (ctx) => ctx.currentTimerIdx !== 0 ? ctx.timersQueue[ctx.currentTimerIdx] : 'undefined' }),
      updateTotalGoal: assign({
        // totalGoal: (ctx) => ctx.timersQueue
        //   .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
        //   .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
      }),
      updateRestartWhenDone: assign({
        restartWhenDone: (ctx) => !ctx.restartWhenDone
        // totalGoal: (ctx) => ctx.timersQueue
        //   .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
        //   .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
      }),
      saveSelectedTimerId: assign({
        selectedTimer: (_, event) => event.timer,
      }),
      clearSelectedTimerId: assign({
        selectedTimer: (_) => undefined,
      }),
      // sendFinishTimerUpdate: pure((_, event) => {
      //   const record = event.record;
      //   if (record)
      //     return sendParent({
      //       type: 'FROM_CHILDREN_FINISH_TIMER',
      //       record,
      //     });
      //   return undefined;
      // }),
      // https://stackoverflow.com/questions/59314563/send-event-to-array-of-child-services-in-xstate
      // collapseTimers: pure((context) =>
      //   context.timersQueue.map((myActor) => send('COLLAPSE', { to: myActor }))
      // ),
      // openTimers: pure((context) =>
      //   context.timersQueue.map((myActor) => send('OPEN', { to: myActor }))
      // ),
    },
  });

export type SessionMachine = typeof sessionMachine;
