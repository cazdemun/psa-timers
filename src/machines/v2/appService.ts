import { ActorRefFrom, assign, createMachine, send, spawn } from "xstate";
import { pure } from 'xstate/lib/actions';
import { Timer, TimerRecord, Session } from '../../models';
import { TimerEvent, TimerMachine, TimerToParentEvent, timerMachine } from './newTimerMachine';
import { SessionEvent, SessionMachine, sessionMachine, SessionToParentEvent } from './newSessionMachine';
import { CRUDToParentEvent, createCRUDMachine } from '../../lib/CRUDMachineV3';
import { sortByIndex } from "../../utils";
import rewardMachine from "./rewardMachine";

export const TimerCRUDMachine = createCRUDMachine<Timer>('timersv2', 'local')
export type TimerCRUDStateMachine = typeof TimerCRUDMachine;
export const SessionCRUDMachine = createCRUDMachine<Session>('sessionsv2', 'local')
export type SessionCRUDStateMachine = typeof SessionCRUDMachine;
export const TimerRecordCRUDMachine = createCRUDMachine<TimerRecord>('timerRecordsv2', 'local')
export type TimerRecordCRUDStateMachine = typeof TimerRecordCRUDMachine;

export type AppServiceContext = {
  rewardActor: ActorRefFrom<typeof rewardMachine>
  timerCRUDMachine: ActorRefFrom<TimerCRUDStateMachine>
  sessionCRUDMachine: ActorRefFrom<SessionCRUDStateMachine>
  timerRecordCRUDMachine: ActorRefFrom<TimerRecordCRUDStateMachine>,
  sessions: ActorRefFrom<SessionMachine>[]
  timers: ActorRefFrom<TimerMachine>[]
};

export type AppServiceEvent =
  | SessionToParentEvent
  | TimerToParentEvent
  | CRUDToParentEvent<Session | Timer>

export const AppService =
  /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqB0tXIO4DsBhAJQFUARAWWQGMALAS3zgGIBtABgF1FRUB7WAwAuDfvl4gAHogCsAZgBMGRbMXyOADg4BOAGybFAdk0AaEAE9EAWgCMGLXoAsinbLc6nRxXtl6Avv7maJgMEAA2YCwAYsQA8pQA+iQUicQAogCC5Jw8SCACQqLikjIIRjryGDqKTraasrKaturytuZWCNY+VfI1nqp1roqBwegYYZEx8Ukp5GlZObZ5fIIiYhL5ZSYcGJoNthpGthx6xkYdNofKza46Ot4KdZqjICETEVGxCckAEgCSABlyBkAHKJaL-UH-ADKv0SABV-pR0sRcpJCusSltEPtlAYdIYmk4OBxFOTLuUjBhbH5jIp9s1NPIAq98PwIHBJCEMWtiptQGVbEY9DTjvtfJpjrZCe1LDZ5LJdpp+iS9PI+k4NU5Xu9sHgiGQqLRGMx4PlMfzSohyU4xfVNJLpbLKd1RY4nE5HXpPBr3Dqgm9xpMwLyihtrQhnNT1bSdML9FLZK7lE1nKoTC1ZIFAkA */
  createMachine({
    context: {
      rewardActor: {} as ActorRefFrom<typeof rewardMachine>,
      timerCRUDMachine: {} as ActorRefFrom<typeof TimerCRUDMachine>,
      sessionCRUDMachine: {} as ActorRefFrom<typeof SessionCRUDMachine>,
      timerRecordCRUDMachine: {} as ActorRefFrom<typeof TimerRecordCRUDMachine>,
      sessions: [],
      timers: [],
    },

    tsTypes: {} as import("./appService.typegen").Typegen0,

    schema: {
      context: {} as AppServiceContext,
      events: {} as AppServiceEvent,
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
          // FROM CRUD ACTOR
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
          }],
          // FROM SESSION ACTOR
          START_TIMER: {
            target: "idle",
            actions: ["sendStartEventToTimer"],
            internal: true
          },
          RESET_TIMER: {
            target: "idle",
            actions: ["sendResetEventToTimer"],
            internal: true
          },
          // FROM TIMER ACTOR
          TIMER_FINISHED: {
            target: "idle",
            actions: ["sendFinishEventToSession"],
            internal: true
          },
        }
      }
    },

    initial: "spawnCRUDMachines"
  }, {
    actions: {
      sendStartEventToTimer: pure((ctx, event) => {
        const timerActor = ctx.timers.find((actor) => actor.id === event.timerId);
        if (!timerActor) return undefined;
        return send({ type: 'START' } as TimerEvent, { to: timerActor });
      }),
      sendResetEventToTimer: pure((ctx, event) => {
        const timerActor = ctx.timers.find((actor) => actor.id === event.timerId);
        if (!timerActor) return undefined;
        return send({ type: 'RESET' } as TimerEvent, { to: timerActor });
      }),
      sendFinishEventToSession: pure((ctx, event) => {
        const sessionActor = ctx.sessions.find((actor) => actor.id === event.timer.sessionId);
        if (!sessionActor) return undefined;
        return send({ type: 'TIMER_FINISHED' } as SessionEvent, { to: sessionActor });
      }),
      spawnCRUDMachines: assign({
        rewardActor: (_) => spawn(rewardMachine, 'reward'),
        sessionCRUDMachine: (_) => spawn(SessionCRUDMachine, 'session-CRUD'),
        timerCRUDMachine: (_) => spawn(TimerCRUDMachine, 'timer-CRUD'),
        timerRecordCRUDMachine: (_) => spawn(TimerRecordCRUDMachine, 'timer-record-CRUD'),
      }),
      spawnTimers: assign({
        timers: (ctx, event) => event.docs
          .map((doc) => {
            const existingMachine = ctx.timers.find((actor) => actor.id === doc._id);
            return existingMachine ?? spawn(timerMachine(doc as Timer), doc._id);
          }),
      }),
      updateTimers: pure((ctx, event) => {
        return event.docs
          .map((doc) => [ctx.timers.find((actor) => actor.id === doc._id), doc])
          .filter((args): args is [ActorRefFrom<TimerMachine>, Timer] => args[0] !== undefined)
          .map(([existingActor, timer]) => {
            return send({ type: 'UPDATE_TIMER', timer } as TimerEvent, { to: existingActor })
          })
      }),
      spawnSessions: assign({
        sessions: (ctx, event) => event.docs
          .slice()
          .sort((a, b) => sortByIndex(a, b))
          .map((doc) => {
            const existingMachine = ctx.sessions.find((actor) => actor.id === doc._id);
            return existingMachine ?? spawn(sessionMachine(doc as Session), doc._id);
          }),
      }),
      updateSessions: pure((ctx, event) => {
        return event.docs
          .map((doc) => [ctx.sessions.find((actor) => actor.id === doc._id), doc])
          .filter((args): args is [ActorRefFrom<SessionMachine>, Session] => args[0] !== undefined)
          .map(([existingActor, session]) => {
            return send({ type: 'UPDATE_SESSION', session } as SessionEvent, { to: existingActor })
          })
      }),
      // createRecord: send((_, event) => ({ type: 'CREATE', doc: event.record }), { to: 'timer-record-CRUD' }),
    },
    guards: {
      comesFromSessionCRUD: (_, event) => event.collection === 'sessionsv2',
      comesFromTimersCRUD: (_, event) => event.collection === 'timersv2',
    }
  });
