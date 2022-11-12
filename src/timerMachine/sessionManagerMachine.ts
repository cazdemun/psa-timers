import { createCRUDMachine } from './../lib/CRUDMachine';
import { ActorRefFrom, assign, createMachine, send, spawn } from "xstate";
import { TimerRecord } from './timerMachine';
import { Session, sessionMachine } from './sessionMachine';

export const SessionCRUDMachine = createCRUDMachine<Session>('sessions', 'local')
export const TimerRecordCRUDMachine = createCRUDMachine<TimerRecord>('timerRecords', 'local')

export type SessionManagerContext = {
  sessionCRUDMachine: ActorRefFrom<typeof SessionCRUDMachine>
  timerRecordCRUDMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>,
  sessions: ActorRefFrom<typeof sessionMachine>[]
};

export type SessionManagerEvent =
  | { type: 'DOCS_LOADED', docs: Session[], article: string }
  | { type: 'DOC_DELETED'; id: string; }
  | { type: 'DOC_UPDATED'; id: string; }
  | { type: 'DOC_CREATED'; id: string; }
  | { type: 'FROM_CHILDREN_FINISH_TIMER', record: TimerRecord }


export const SessionManagerMachine = createMachine({
  initial: 'start',
  tsTypes: {} as import("./sessionManagerMachine.typegen").Typegen0,
  schema: { context: {} as SessionManagerContext, events: {} as SessionManagerEvent },
  context: {
    sessionCRUDMachine: {} as ActorRefFrom<typeof SessionCRUDMachine>,
    timerRecordCRUDMachine: {} as ActorRefFrom<typeof TimerRecordCRUDMachine>,
    sessions: [],
  },
  states: {
    start: {
      always: {
        target: 'idle',
        actions: 'spawnCRUDMachine'
      },
    },
    idle: {
      on: {
        FROM_CHILDREN_FINISH_TIMER: {
          target: 'idle',
          actions: 'addRecord',
        },
      },
    },
  },
  on: {
    DOCS_LOADED: [
      {
        cond: 'comesFromSessionCRUD',
        target: 'idle',
        actions: 'spawnSessions'
      },
    ]
  },
}, {
  actions: {
    spawnCRUDMachine: assign({
      timerRecordCRUDMachine: (_) => spawn(TimerRecordCRUDMachine, 'timer-record-CRUD'),
      sessionCRUDMachine: (_) => spawn(SessionCRUDMachine, 'session-CRUD'),
    }),
    spawnSessions: assign({
      sessions: (_, event) => event.docs
        .map((s) => spawn(sessionMachine(s._id, s.title, s.timers))),
    }),
    addRecord: send((_, event) => ({ type: 'CREATE', doc: event.record }), { to: 'timer-record-CRUD' })
  },
  guards: {
    comesFromSessionCRUD: (_, event) => event.article === 'sessions',
  }
});
