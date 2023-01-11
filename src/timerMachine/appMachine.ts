import { createCRUDMachine } from './../lib/CRUDMachine';
import { ActorRefFrom, assign, createMachine, send, spawn } from "xstate";
import { Timer, TimerRecord } from './timerMachine';
import { Session, sessionMachine } from './sessionMachine';
import { pure } from 'xstate/lib/actions';

type OptionalPriority = {
  priority?: number
  created: number
}

const sortByOptionalPriorityDefaultsCreated = <T extends OptionalPriority>(a: T, b: T): number => {
  if (a.priority !== undefined && b.priority === undefined) return -1;
  if (a.priority === undefined && !!b.priority !== undefined) return 1;
  if (a.priority === b.priority) return a.created - b.created;
  return (b.priority ?? 0) - (a.priority ?? 0);
}

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

  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqB0BLCAbMAxAGIBKA8gLID6AwgBICSAMgCIkCiAclUQ5wwGU6VACoMK7EgG0ADAF1EoVAHtYWAC5ZlAO0UgAHogAsARhMYAHEZkB2GwE4bVgGz2ZzgKwAaEAE9EJjIAzEEYMm5BRhYmzjIm1iYAvok+aJg4+MTk1DQkAKosVCxkNAJUTGQAgizsLLIKSCAqapo6eoYIALQxHmFB9h4uJhb2AEyjIT7+CIETlsPORjbjMjIeTsmp6Nh4hKSUtPmFxaXlVTV1Jg1Kqhpauo0d3WMYozb9HqOr8UajJlMBeKjDB2aLRT72NzRTYgNIYWCoZAAd20WG0UAEcDUOlyBQoyAAxgALNF7bKHApFEplCrVWr1PTNO5tR4BIxGDAmJwWUE2QLOIKDAEIDwyYFOIIWKWjKUeGIWIIwuEI5Go9EiLAAWzAACdYJVtBASGACcodRBYLiWPjiaTYFkDlaqadaRcGY0ma0HqAOvEbK8uWMTG9ho5RkZhRZ3BgxmMZc5w4KTB5kikQNplBA4Ho0ozbl72ohOuGZK93gMvnF2X9haNIa862YXM4uTKldsMmA8y17oWEEE65ZRh51q5RSZ7FKbMKxr0bEZITzwvExu3MCqUWiMVj7labSTtF2Pfne6yEH8LK97LEjEEFjF3sLJc4QY2J84bDIpTE1-DEZv1S1XV9UNY1TXNS0jn3O1u2Zb0DDZUIBxHcMuSsRdvD8RAE1CTwPCMWI6zcN4U1TIA */
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
    preserveActionOrder: true,
    predictableActionArguments: true,
    id: "app",
    initial: "spawningSessionCRUDMachine",
    states: {
      idle: {
        on: {
          FROM_CHILDREN_FINISH_TIMER: {
            target: "idle",
            actions: "createRecord",
            internal: false,
          },

          FROM_CRUD_DOCS_LOADED: [{
            target: "idle",
            cond: "comesFromTimersCRUD",
            actions: "sendTimersToSessions",
            internal: false,
          }, {
            target: "idle",
            internal: true,
            cond: "comesFromSessionCRUD",
            actions: "sendUpdateSessionActors"
          }]
        },
      },

      spawningSessionCRUDMachine: {
        entry: "spawnSessionCRUDMachine",

        on: {
          FROM_CRUD_DOCS_LOADED: {
            target: "spawningTimersAndRecordsCRUDMachines",
            cond: "comesFromSessionCRUD",
            actions: "spawnSessions",
          }
        }
      },

      spawningTimersAndRecordsCRUDMachines: {
        entry: "spawnCRUDMachines",

        on: {
          FROM_CRUD_DOCS_LOADED: {
            target: "idle",
            cond: "comesFromTimersCRUD",
            actions: "sendTimersToSessions",
          }
        },

        description: `Timers are spawned later because sessions do not have a timers field anymore. I could modify that but I don't want to deal with population issues (which they may not be issues after all but this could be next).`
      }
    },
  }, {
    actions: {
      spawnSessionCRUDMachine: assign({
        sessionCRUDMachine: (_) => spawn(SessionCRUDMachine, 'session-CRUD'),
      }),
      spawnSessions: assign({
        sessions: (_, event) => (event.docs as Session[])
          .map((s) => spawn(sessionMachine(s._id, s.title, s.timers, s.sound), s._id)),
      }),
      spawnCRUDMachines: assign({
        timerCRUDMachine: (_) => spawn(TimerCRUDMachine, 'timer-CRUD'),
        timerRecordCRUDMachine: (_) => spawn(TimerRecordCRUDMachine, 'timer-record-CRUD'),
      }),
      sendTimersToSessions: pure(
        (ctx, event) => ctx.sessions
          .map((session) => {
            const timers = (event.docs as Timer[])
              .filter((timer) => timer.sessionId === session.id)
              .sort((a, b) => sortByOptionalPriorityDefaultsCreated(a, b));
            return send({ type: 'SPAWN_TIMERS', docs: timers }, { to: session })
          })
      ),
      createRecord: send((_, event) => ({ type: 'CREATE', doc: event.record }), { to: 'timer-record-CRUD' }),
      sendUpdateSessionActors: () => {
        // In order for this to be efficient, I need session machine to have a entity property 
        // so it can be easily updated, and a parallel state that always accept this change
        // Session article only contains metadata so it shouldn't affect running stuff
      },
    },
    guards: {
      comesFromSessionCRUD: (_, event) => event.article === 'sessions',
      comesFromTimersCRUD: (_, event) => event.article === 'timers',
    }
  });
