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
  | { type: 'FROM_CRUD_DOCS_LOADED', docs: Session[], article: string }
  | { type: 'FROM_CRUD_DOC_DELETED'; id: string; }
  | { type: 'FROM_CRUD_DOC_UPDATED'; id: string; }
  | { type: 'FROM_CRUD_DOCS_CREATED'; docs: any[], article: string; }
  | { type: 'FROM_CHILDREN_REQUEST_CREATE_TIMER'; timer: Timer; }
  | { type: 'FROM_CHILDREN_FINISH_TIMER'; record: TimerRecord; }


export const SessionManagerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgDEAlAeQFkB9AYQoFUARO1qhgZToBkqAQVYBRVgG0ADAF1EoAA4B7WLgAuuRfjkgAnogC0ADgCcAOgCsAGhAAPRAEYATABZzpgMyTj5x8YDshs4AbMaShgC+4dZoWHiERKawqugATqokUrJIIEoq6pradgjO9u6moc5eQSF+xoaGfu7WegiO9oYWfk5dbT59jpHRGDgExKa4EAA2YOTU9ExsHFy8TCKCACpimdq5ahpa2UWG9vamjkHnzm1+5pK3VrqI7sZlPvZB5s-uVwGNgyAxEbxcZTGaUWiMAASAEk+KwKCIAHJ0MjQxHQ7iQujraE0EQUbbZXb5A6gI6SMpeSR+WoBYKhPzNRBBSQWULfY4s+yVO6RKIgfCKCBwbSAuLEHbKPYFQ4OILOCxvW4mK6hapMhD6ey1UySPWSRzmapeVyGAb8sWjBJJVKqSV5faFRCGjpeeyfezGYz076Mx6aoJ+Uw077uC71czvcz-S3AibTe3S0m2RBdIKmILuRy0+qevXODWOQxuPzOL0NN1l81DWJWxLydAAd3wBCg3DgKk0C1YNFrhETJKdrXMQfcRuLknlxfcfnV-uCjg8-hchiq3kjMeG4oSjfQe3wUDIihS7dgnfw8CJUsHsoQnkXI-M5nL-nc7QeLXMhjKwSuYZ8gSuM4m59mMsANs2rbrLgqBgCksCCPgEAUGAmDHhAsDdr2QIileDoymSzpOIqvRhN6viTkEGohGYQQRkBjjnLO7h8uEQA */
  createMachine({
  context: {
    timerCRUDMachine: {} as ActorRefFrom<typeof TimerCRUDMachine>,
    sessionCRUDMachine: {} as ActorRefFrom<typeof SessionCRUDMachine>,
    timerRecordCRUDMachine: {} as ActorRefFrom<typeof TimerRecordCRUDMachine>,
    sessions: [],
  },
  tsTypes: {} as import("./sessionManagerMachine.typegen").Typegen0,
  schema: {
    context: {} as SessionManagerContext,
    events: {} as SessionManagerEvent,
  },
  id: "(machine)",
  initial: "start",
  states: {
    start: {
      always: {
        target: "idle",
        actions: "spawnCRUDMachines",
      },
    },
    idle: {
      on: {
        FROM_CRUD_DOCS_CREATED: {
          target: "idle",
          actions: "sendReceiveTimerToSession",
          internal: false,
        },
        FROM_CHILDREN_FINISH_TIMER: {
          target: "idle",
          actions: "addRecord",
          internal: false,
        },
      },
    },
    spawningSessionCRUDMachine: {},
    waitingForSessions: {},
    spawningTimersAndRecordsCRUDMachines: {},
  },
  on: {
    FROM_CRUD_DOCS_LOADED: {
      target: ".idle",
      cond: "comesFromSessionCRUD",
      actions: "spawnSessions",
    },
  },
}, {
    actions: {
      sendReceiveTimerToSession: pure((ctx, event) => {
        if (!event.docs) return undefined;
        // no guard style since this behaviour could be expanded for other articles
        if (event.article === 'timers') {
          // TODO: define behaviour from insert many docs
          if (Array.isArray(event.docs)) return undefined;
          const newTimer = event.docs as Timer;
          const [sessionRef] = ctx.sessions.filter((s) => s.id === newTimer.sessionId)
          if (!sessionRef) return undefined;
          return send({ type: 'FROM_CRUD_DOCS_CREATED', doc: newTimer }, { to: sessionRef });
        }
        return undefined;
      }),
      spawnCRUDMachines: assign({
        timerCRUDMachine: (_) => spawn(TimerCRUDMachine, 'timer-CRUD'),
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
