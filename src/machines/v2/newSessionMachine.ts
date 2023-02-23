import { TimerMachine, timerMachine } from './newTimerMachine';
import { ActorRefFrom, assign, createMachine, sendParent, spawn, send } from "xstate";
import { pure } from 'xstate/lib/actions';
import { AlarmName, getAlarm } from '../../services/alarmService';
import { Session, Timer, TimerRecord } from '../../models';

const DEFAULT_GOAL = 10000; // milliseconds

export type SessionContext = {
  session: Session
  //
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
  | { type: 'UPDATE_SESSION'; session: Session; }
  | { type: 'OPEN_STATISTICS'; }
  | { type: 'CLOSE_STATISTICS'; }
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
  | { type: 'REQUEST_CREATE_TIMER' }
  | { type: 'FROM_CRUD_DOCS_CREATED'; timer: Timer }
  | { type: 'SPAWN_TIMERS'; docs: Timer[] }
  | { type: 'OPEN_TIMER_MODAL'; timerId: string; }
  | { type: 'CLOSE_TIMER_MODAL' }


export const sessionMachine = (
  session: Session,
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGIDKACgIIDqAcgPoAqAkgLICiASngNoAMAuoqAA4boALpiw8QAD0QBaAKwBGABwA6OTIBMAZnUyNatQHYNAFgA0IAJ7S1ANiNKjRuezUL9a5wpkKAvt7MpYdGwcAFUCABEiKgYKPAY8PBoAeTIObiQQfiERMUsEKRs1JRkzSQR1O1t2azUZX39UESUAMwAnMDAlAKCsJTQIABswHCJw8LSxLLRhbFzEOTlrJQ0NfQWHGSMATndTCWl5Ow2NOUd9IwUtt3qQbqa2jq7G7D7B4YAxJiS6CgBhAAkaAAZcJMBiUd40Mg0PD-aj0ZgTDJTGaiDJlWSnexGHSnOTnS5uMx5fHKBSrdY47a7G53F4PTp03r9IahCJRGJUJJUIhAigAcSSvKRfAE0xy6IOWOOeIJVzUxMQ1mUKzWpypO3YRlpz16DKegSaLOGYLwPKYVFi8USKRFmTFqLEGMO2NxZwu8sVCHcywp6s2mo0W2sOsN9PajN1r1ZYLoSQAapyEUw7SiJaBndKcSd3YSFRYrPolNYagpPJsZOx9MGtaGei0Iwb68acACiGR+UmqECGKmHen9vkXTLc56CwgTjIlOS1RtqbW-Lco-qmdHhr8kkCgUQCHF4YwWH3srNJUOs278R6ieOpPopyWXOWcVXg3X7o3Vy2kgRwfvmGwuEmfsTwzKUjmzWUr3zPIpDkTRi1LJ9K2rENF1XfUADc0DAAB3NccC5fl+R7WIaHCBgSCIABNAD0lFY80VAPI1Dg31Zw1XZSjA10c0vPM33DR4sNw-DCOImI40iIEj3FEDB0xcCLzla9mPOac-TnTVtTQ5dG2EvCAFsMAgABDAYCKSIiSMk4VAORYDGPk4cINHFTEFVNjKQDGkdLDPU9OwvD0AgXCTPMWALKsiSkikmTHVPWRqiUfRDCMIM+PlEpxyDLZ1PY7yFwaPyGyEwKun6ULwsi8TSPIyiaLigdnSSlLjHS5Tai9Iwak8-1520ormywQQwFaDCzPw79f1oA8KBs6S7Po2THIxFY5GWBRnH0BQFjghw9hJRZcusdhFjUIw9GsVZrl8oaRrGiaW0+b4-kBEEwQhKEYThGbEUW+0GKdaRzjsFZqlWGQ3GsSH9C9JwvGLGQvBLWx1lQwajWG0bxoGfCzSIC0-xTf60zk50TiULZ5BOVQtG29QvSp9aZCuBRrBSlw1HlATmSxh7ceEAzRroYyzNbIEkj3X6mDmmLbLogHlqB-ItCnDRLlZnEkYqOGbGUHF8WcPQdip-Qeb6Pmccmn9KHx2gzRoX5aKAwGErxYpVBSq6anO-QSy9O8pzcM4ZGsBZ9CrM3bsx+6rdgQQTOEeO0AAYwi34Jb3O2YVoJ3GrJ6RTjV+Q1h2lxthWAPFCUWptq2OQqYuljUMXLBjLgMQmRdpWErZqcRwytyVbZlRSyu7Z2C8RxzYZbv4tA-IdqLAeOq9AotmUB9LhcK6y2qAal2KlddTnprgesXKV6gteWPWs6y1qK4tiMKsZ4-KNjVPgv8jcdar7zOGixeqaR8hjQSnR9JfxWufS+LlB7QXmOdPKpx1acyOnUaO4ClD6TXFA5Wt4WI8UggA8cLEiiqi8v1N+pURJGVMgMPBCVf5ENcggic3VkF9S0tQiBZVgqVXgPZV2C8CF-zgavccFx1oUK4aAw+d1sZmUYSI6s5CNDgzvFDGGXorrsGSpDNmCgjB3ncC4c2aBLaPTeMo+S6iNDJU2jUbaF0I7jy9AoeCBI7xbHrtrKm5jLECzQELVoIt6E2NWqxFm6jgxaHUewVwcMX5TkNizdwlwHDnACbHCa8dE5oGTmnCJiC7DsFZlcC6JwL5rHcZ4i43jfFI38b4bwQA */
  createMachine({
    context: {
      session,
      _id: session._id,
      title: session.title,
      timersQueue: [],
      currentTimerIdx: 0,
      totalGoal: 0,
      selectedTimerId: undefined,
      loop: 0,
      restartWhenDone: true,
      sound: session.sound,
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
      UPDATE_SESSION: {
        actions: 'updateSession'
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
        // totalGoal: (_, event) => event.docs.reduce((acc, timer) => acc + timer.millisecondsOriginalGoal, 0),
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
        // currentTimerIdx: (context) => 0,
      }),
      updateSession: assign({
        session: (_, event) => event.session,
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
          // totalGoal: newTimersQueue
          //   .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
          //   .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
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
        if (ctx.session.sound) (new Audio(getAlarm(ctx.session.sound))).play();
        return send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] })
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
      updateLoop: assign((ctx) => {
        const isLastTimer = ctx.currentTimerIdx === ctx.timersQueue.length - 1;
        if (isLastTimer) return { loop: ctx.loop + 1 };
        return { loop: ctx.loop };
      }),
      // startNextTimer: (ctx) => ctx.currentTimerIdx !== 0 ? send({ type: 'START' }, { to: ctx.timersQueue[ctx.currentTimerIdx] }) : undefined,
      // startNextTimer: send({ type: 'START' }, { to: (ctx) => ctx.currentTimerIdx !== 0 ? ctx.timersQueue[ctx.currentTimerIdx] : 'undefined' }),
      updateTotalGoal: assign({
        // totalGoal: (ctx) => ctx.timersQueue
        //   .map((t) => t.getSnapshot()?.context.millisecondsCurrentGoal)
        //   .reduce((acc, x) => (x ?? 0) + (acc ?? 0), 0) ?? 0,
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

export type SessionMachine = typeof sessionMachine;
