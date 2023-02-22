import { createCRUDMachine } from '../../lib/CRUDMachine';
import { ActorRefFrom, assign, createMachine, send, spawn } from "xstate";
import { Timer, TimerRecord, timerMachine } from './newTimerMachine';
import { Session, sessionMachine } from './newSessionMachine';
import { pure } from 'xstate/lib/actions';

type OptionalPriority = {
  priority?: number
  created: number
}

const sortByOptionalPriorityDefaultsCreated = <T extends OptionalPriority>(a: T, b: T): number => {
  if (a.priority !== undefined && b.priority === undefined) return -1;
  if (a.priority === undefined && b.priority !== undefined) return 1;
  if (a.priority === b.priority) return a.created - b.created;
  return (b.priority ?? 0) - (a.priority ?? 0);
}

export const TimerCRUDMachine = createCRUDMachine<Timer>('timersv2', 'local')
export const SessionCRUDMachine = createCRUDMachine<Session>('sessionsv2', 'local')
export const TimerRecordCRUDMachine = createCRUDMachine<TimerRecord>('timerRecordsv2', 'local')

export type SessionManagerContext = {
  timerCRUDMachine: ActorRefFrom<typeof TimerCRUDMachine>
  sessionCRUDMachine: ActorRefFrom<typeof SessionCRUDMachine>
  timerRecordCRUDMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>,
  sessions: ActorRefFrom<typeof sessionMachine>[]
  timers: ActorRefFrom<typeof timerMachine>[]
};

export type SessionManagerEvent =
  | { type: 'FROM_CRUD_DOCS_LOADED', docs: (Session | Timer)[], article: string }
  | { type: 'FROM_CRUD_DOC_DELETED'; id: string; }
  | { type: 'FROM_CRUD_DOC_UPDATED'; id: string; }
  | { type: 'FROM_CRUD_DOCS_CREATED'; docs: any[], article: string; }
  | { type: 'FROM_CHILDREN_REQUEST_CREATE_TIMER'; timer: Timer; }
  | { type: 'FROM_CHILDREN_FINISH_TIMER'; record: TimerRecord; }


export const AppService =

  
/** @xstate-layout N4IgpgJg5mDOIC5QEMAOqB0BLCAbMAxAGIBKA8gLID6AwgBICSAMgCIkCiAclUQ5wwGU6VACoMK7EgG0ADAF1EoVAHtYWAC5ZlAO0UgAHogCMADgAsZjAHYTRo2YDMp81YBsrgDQgAnogBMVg4YZjKuAX4mkaYOrgC+sV5omDj4xOTUNCQAqixULGQ0AlRMZACCLOwssgpIICpqmjp6hghGVgCsAJwYMu1mXV1mVn6u7Z4+xlZWwe1OIX7tJjadofGJ6Nh4hKSUtNm5+YXFZRVVRjVKqhpaurUtbQ7dnQ6Bz85D7l6+CLYY7TIAmRuPzPTr9BxrEBJDCwVDIADu2iw2igAjgah0mRyFGQAGMABbI7bpPY5PIFIolcqVap6erXJp3RAOfp-IxjBZfZmODCRCIsuzuNomSHQ2EIpEokRYAC2YAATrBStoICQwLjlPKILAsSwcQSibA0rtdeSjlTTrTavTGrdQPcQZYRu0+ktQr0hlyECygnyTAKjEKbHFIdplBA4HoknSrrbmogALTjb4J9oYToZzomGSdZ1GGLDUUbFJgGMNG7x1rPPwYR69Iy9LoyEx+L0vSwOQaNtrtGxGIuYcWI5Go9E3XX6wnaUvW2MVpkIMytibenmuHNLhxOMFZ9wDmFw4dS2UKpUqtUarU6-aTw1lhl2gyIbM15293N+GIOCJt5u1roxBm+aBK4YLxPEQA */
createMachine({
    context: {
      timerCRUDMachine: {} as ActorRefFrom<typeof TimerCRUDMachine>,
      sessionCRUDMachine: {} as ActorRefFrom<typeof SessionCRUDMachine>,
      timerRecordCRUDMachine: {} as ActorRefFrom<typeof TimerRecordCRUDMachine>,
      sessions: [],
      timers: [],
    },
    tsTypes: {} as import("./appService.typegen").Typegen0,
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
