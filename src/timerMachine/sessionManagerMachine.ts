import { createCRUDMachine } from './../lib/CRUDMachine';
import { ActorRefFrom, assign, createMachine, spawn } from "xstate";
import { Session, sessionMachine } from './sessionMachine';

export const SessionCRUDMachine = createCRUDMachine<Session>('sessions', 'local')

export type SessionManagerContext = {
  sessionCRUDMachine: ActorRefFrom<typeof SessionCRUDMachine>
  sessions: ActorRefFrom<typeof sessionMachine>[]
};

export type SessionManagerEvent =
  | { type: 'DOCS_LOADED', docs: Session[] }
  | { type: 'DOC_DELETED'; id: string; }
  | { type: 'DOC_UPDATED'; id: string; }
  | { type: 'DOC_CREATED'; id: string; }

export const SessionManagerMachine = createMachine({
  initial: 'start',
  tsTypes: {} as import("./sessionManagerMachine.typegen").Typegen0,
  schema: { context: {} as SessionManagerContext, events: {} as SessionManagerEvent },
  context: {
    sessionCRUDMachine: {} as ActorRefFrom<typeof SessionCRUDMachine>,
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
    },
  },
  on: {
    DOCS_LOADED: {
      target: 'idle',
      actions: 'spawnSessions'
    }
  },
}, {
  actions: {
    spawnCRUDMachine: assign({
      sessionCRUDMachine: (_) => spawn(SessionCRUDMachine),
    }),
    spawnSessions: assign({
      sessions: (_, event) => event.docs.map((s) => spawn(sessionMachine(s._id, s.title, s.timers))),
    }),
  },
});
