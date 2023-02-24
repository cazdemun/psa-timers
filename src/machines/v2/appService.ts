import { ActorRefFrom, assign, createMachine, send, spawn } from "xstate";
import { pure } from 'xstate/lib/actions';
import { Timer, TimerRecord, Session } from '../../models';
import { TimerMachine, timerMachine } from './newTimerMachine';
import { SessionMachine, sessionMachine } from './newSessionMachine';
import { createCRUDMachine } from '../../lib/CRUDMachineV3';
import { trace } from "../../utils";

export const TimerCRUDMachine = createCRUDMachine<Timer>('timersv2', 'local')
export type TimerCRUDStateMachine = typeof TimerCRUDMachine;
export const SessionCRUDMachine = createCRUDMachine<Session>('sessionsv2', 'local')
export type SessionCRUDStateMachine = typeof SessionCRUDMachine;
export const TimerRecordCRUDMachine = createCRUDMachine<TimerRecord>('timerRecordsv2', 'local')
export type TimerRecordCRUDStateMachine = typeof TimerRecordCRUDMachine;

export type AppServiceContext = {
  timerCRUDMachine: ActorRefFrom<TimerCRUDStateMachine>
  sessionCRUDMachine: ActorRefFrom<SessionCRUDStateMachine>
  timerRecordCRUDMachine: ActorRefFrom<TimerRecordCRUDStateMachine>,
  sessions: ActorRefFrom<SessionMachine>[]
  timers: ActorRefFrom<TimerMachine>[]
};

export type SessionManagerEvent =
  | { type: 'FROM_CRUD_DOC_DELETED'; id: string; }
  | { type: 'FROM_CRUD_DOC_UPDATED'; id: string; }
  | { type: 'FROM_CRUD_DOCS_CREATED'; docs: any[]; collection: string; }
  | { type: 'FROM_CHILDREN_REQUEST_CREATE_TIMER'; timer: Timer; }
  // Events actually used
  | { type: 'FROM_CHILDREN_FINISH_TIMER'; record: TimerRecord; }
  | { type: 'FROM_CRUD_READ', docs: (Session | Timer)[]; collection: string; }
  // Proposed events
  | { type: 'TIMER_FINISHED', sessionId: string; fromTimerId: string; }
  | { type: 'START_TIMER', timerId: string }



export const AppService =


  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqB0tXIO4DsBhAJQFUARAWWQGMALAS3zgGIBtABgF1FRUB7WAwAuDfvl4gAHogCsAZgBMGRbMXyOADg4BOAGybFAdk0AaEAE9EAWgCMGLXoAsinbLc6nRxXtl6Avv7maJgMEAA2YCwAYsQA8pQA+iQUicQAogCC5Jw8SCACQqLikjIIRjryGDqKTraasrKaturytuZWCNY+VfI1nqp1roqBwegYYZEx8Ukp5GlZObZ5fIIiYhL5ZSYcGJoNthpGthx6xkYdNofKza46Ot4KdZqjICETEVGxCckAEgCSABlyBkAHKJaL-UH-ADKv0SABV-pR0sRcpJCusSltEPtlAYdIYmk4OBxFOTLuUjBhbH5jIp9s1NPIAq98PwIHBJCEMWtiptQGVbEY9DTjvtfJpjrZCe1LDZ5LJdpp+iS9PI+k4NU5Xu9sHgiGQqLRGMx4PlMfzSohyU4xfVNJLpbLKd1RY4nE5HXpPBr3Dqgm9xpMwLyihtrQhnNT1bSdML9FLZK7lE1nKoTC1ZIFAkA */
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
      context: {} as AppServiceContext,
      events: {} as SessionManagerEvent,
    },

    preserveActionOrder: true,
    predictableActionArguments: true,
    id: "app",

    states: {
      spawnCRUDMachines: {
        exit: "spawnCRUDMachines",

        always: "idle"
      },

      idle: {
        on: {
          FROM_CHILDREN_FINISH_TIMER: {
            target: "idle",
            actions: "createRecord",
            internal: true
          },
          FROM_CRUD_READ: [{
            target: "idle",
            cond: "comesFromSessionCRUD",
            actions: ["spawnSessions", "updateSessions"],
            internal: true
          }, {
            target: "idle",
            cond: "comesFromTimersCRUD",
            actions: ["spawnTimers", "updateTimers"],
            internal: true
          }]
        }
      }
    },

    initial: "spawnCRUDMachines"
  }, {
    actions: {
      spawnCRUDMachines: assign({
        sessionCRUDMachine: (_) => spawn(SessionCRUDMachine, 'session-CRUD'),
        timerCRUDMachine: (_) => spawn(TimerCRUDMachine, 'timer-CRUD'),
        timerRecordCRUDMachine: (_) => spawn(TimerRecordCRUDMachine, 'timer-record-CRUD'),
      }),
      spawnTimers: assign({
        timers: (ctx, event) => event.docs.map((doc) => {
          const existingMachine = ctx.timers.find((actor) => actor.id === doc._id);
          return existingMachine ?? spawn(timerMachine(doc as Timer), doc._id);
        }),
      }),
      updateTimers: pure((ctx, event) => {
        return event.docs
          .map((doc) => [ctx.timers.find((actor) => actor.id === doc._id), doc])
          .filter((args): args is [ActorRefFrom<TimerMachine>, Timer] => args[0] !== undefined)
          .map(([existingActor, timer]) => {
            return send({ type: 'UPDATE_TIMER', timer }, { to: existingActor })
          })
      }),
      spawnSessions: assign({
        sessions: (ctx, event) => event.docs.map((doc) => {
          const existingMachine = ctx.sessions.find((actor) => actor.id === doc._id);
          console.log(doc);
          return existingMachine ?? spawn(sessionMachine(doc as Session), doc._id);
        }),
      }),
      updateSessions: pure((ctx, event) => {
        return event.docs
          .map((doc) => [ctx.sessions.find((actor) => actor.id === doc._id), doc])
          .filter((args): args is [ActorRefFrom<SessionMachine>, Session] => args[0] !== undefined)
          .map(([existingActor, session]) => {
            return send({ type: 'UPDATE_SESSION', session }, { to: existingActor })
          })
      }),
      // sendTimersToSessions: pure(
      //   (ctx, event) => ctx.sessions
      //     .map((session) => {
      //       const timers = (event.docs as Timer[])
      //         .filter((timer) => timer.sessionId === session.id)
      //         .sort((a, b) => sortByOptionalPriorityDefaultsCreated(a, b));
      //       return send({ type: 'SPAWN_TIMERS', docs: timers }, { to: session })
      //     })
      // ),
      createRecord: send((_, event) => ({ type: 'CREATE', doc: event.record }), { to: 'timer-record-CRUD' }),
    },
    guards: {
      comesFromSessionCRUD: (_, event) => event.collection === 'sessionsv2',
      comesFromTimersCRUD: (_, event) => event.collection === 'timersv2',
    }
  });
