import { createCRUDMachine } from './../lib/CRUDMachine';
import { ActorRefFrom, assign, createMachine, send, spawn } from "xstate";
import { Timer, TimerRecord } from './timerMachine';
import { Session, sessionMachine } from './sessionMachine';
import { pure } from 'xstate/lib/actions';

export const TimerCRUDMachine = createCRUDMachine<Timer>('timers', 'local')
export const SessionCRUDMachine = createCRUDMachine<Session>('sessions', 'local')
export const TimerRecordCRUDMachine = createCRUDMachine<TimerRecord>('timerRecords', 'local')

export type SessionManagerContext = {
  timerCRUDMachine: ActorRefFrom<typeof TimerCRUDMachine>
  sessionCRUDMachine: ActorRefFrom<typeof SessionCRUDMachine>
  timerRecordCRUDMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>,
  sessions: ActorRefFrom<typeof sessionMachine>[]
};

export type SessionManagerEvent =
  | { type: 'FROM_CRUD_DOCS_LOADED', docs: (Session | Timer)[], article: string }
  | { type: 'FROM_CRUD_DOC_DELETED'; id: string; }
  | { type: 'FROM_CRUD_DOC_UPDATED'; id: string; }
  | { type: 'FROM_CRUD_DOCS_CREATED'; docs: any[], article: string; }
  | { type: 'FROM_CHILDREN_REQUEST_CREATE_TIMER'; timer: Timer; }
  | { type: 'FROM_CHILDREN_FINISH_TIMER'; record: TimerRecord; }


export const AppMachine =

  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOlwgBswBiAMQCUB5AWQH0BhACQEkAZAEXoBRAHKta3EdwDKnVgBVuzIfQDaABgC6iUAAcA9rFwAXXPvw6QAD0QAWAIz2SADlvqA7O4Cc71wDYvdT8AVgAaEABPRHt1AGZYknVA2Ntnez91ezd7AF8c8LQsPEJScio6JjZ2egBVflZ+RnZpVl5GAEF+IX4NbSQQAyNTc0sbBABaRwAmEjDI6LiEpMXnPyn4nym8gowcAmISWF10AHd8AihpOCNzarrmIv3qXstBkzMLfrGpv2cSVK8IXUzi8timgXc4SiCHsXgSU3cKSmriC9hBsW2IEKexKJBO6He+CgtH0ACcrrAbvhYBUWBxavVGs1Wh0uj0tK9DO8Rl9osEErZgupggFYlNgepbPEoYhYl4vCQprZ5SrVfLbJjscUDkdTucifJcKgwKTYO18BB6GBMGSILA7vwHji4M8Of03sNPqBvs53CRPL7he4-AC-PZYjKEMEfP81XGvJrdtrSPjCcSyYbjabzZbrbaaQw6Q6Gk0Wm1Ot0Xu6uZ7Rny-P8QX41vFnLFnFNglNI74Eu5gnl8iB8PoIHBLFr9kROUMPnWJul1LNI-YZiD3Er1u5lUklYnHriymAZ9yvdZZeCXJ3gsGvELYc5fZGvJ3-cqvIGvFkX-vnaRdWcFwUlSDpOtqJ61ryCBTD8JAxL8Qohs4-LBn4K7qDMcobqkSQBMEwRZL+yZ4gSphEiS5LXB88DVrOPLeog4JOGK+Edn4G5KrYwaRrEMQkICYKxCEyK2IKA5DpOuIAfqUCZiaZoWlaNqknaoEHuOtGnvOUz2MEiRdrpwKguCQRofMUaxEucLIYKYI-MGGISUmU4kWmFFydmil5ipNF6DWc5QZ2tguBhulcUZvpwj2cRwUqH5cQ4OnAoOORAA */
  createMachine({
    context: {
      timerCRUDMachine: {} as ActorRefFrom<typeof TimerCRUDMachine>,
      sessionCRUDMachine: {} as ActorRefFrom<typeof SessionCRUDMachine>,
      timerRecordCRUDMachine: {} as ActorRefFrom<typeof TimerRecordCRUDMachine>,
      sessions: [],
    },
    tsTypes: {} as import("./appMachine.typegen").Typegen0,
    schema: {
      context: {} as SessionManagerContext,
      events: {} as SessionManagerEvent,
    },
    id: "(machine)",
    initial: "spawningSessionCRUDMachine",
    states: {
      idle: {
        on: {
          FROM_CHILDREN_FINISH_TIMER: {
            target: "idle",
            actions: "createRecord",
            internal: false,
          },
          FROM_CRUD_DOCS_LOADED: {
            target: "idle",
            cond: "comesFromTimersCRUD",
            actions: "sendTimersToSessions",
            internal: false,
          },
        },
      },
      spawningSessionCRUDMachine: {
        always: {
          target: "waitingForSessions",
          actions: "spawnSessionCRUDMachine",
        },
      },
      waitingForSessions: {
        on: {
          FROM_CRUD_DOCS_LOADED: {
            target: "spawningTimersAndRecordsCRUDMachines",
            cond: "comesFromSessionCRUD",
            actions: "spawnSessions",
          },
        },
      },
      spawningTimersAndRecordsCRUDMachines: {
        always: {
          target: "waitingForTimersAndRecords",
          actions: "spawnCRUDMachines",
        },
      },
      waitingForTimersAndRecords: {
        on: {
          FROM_CRUD_DOCS_LOADED: {
            target: "idle",
            cond: "comesFromTimersCRUD",
            actions: "sendTimersToSessions",
          },
        },
      },
    },
  }, {
    actions: {
      spawnSessionCRUDMachine: assign({
        sessionCRUDMachine: (_) => spawn(SessionCRUDMachine, 'session-CRUD'),
      }),
      spawnSessions: assign({
        sessions: (_, event) => (event.docs as Session[])
          .map((s) => spawn(sessionMachine(s._id, s.title, s.timers), s._id)),
      }),
      spawnCRUDMachines: assign({
        timerCRUDMachine: (_) => spawn(TimerCRUDMachine, 'timer-CRUD'),
        timerRecordCRUDMachine: (_) => spawn(TimerRecordCRUDMachine, 'timer-record-CRUD'),
      }),
      sendTimersToSessions: pure(
        (ctx, event) => ctx.sessions
          .map((session) => {
            const timers = (event.docs as Timer[]).filter((timer) => timer.sessionId === session.id)
            return send({ type: 'SPAWN_TIMERS', docs: timers }, { to: session })
          })
      ),
      createRecord: send((_, event) => ({ type: 'CREATE', doc: event.record }), { to: 'timer-record-CRUD' })
    },
    guards: {
      comesFromSessionCRUD: (_, event) => event.article === 'sessions',
      comesFromTimersCRUD: (_, event) => event.article === 'timers',
    }
  });
