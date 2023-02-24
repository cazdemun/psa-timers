import { TimerMachine } from './newTimerMachine';
import { ActorRefFrom, assign, createMachine, sendParent, send } from "xstate";
import { pure } from 'xstate/lib/actions';
import { AlarmName, getAlarm } from '../../services/alarmService';
import { Session, Timer, TimerRecord } from '../../models';

export type SessionContext = {
  session: Session
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
  restartWhenDone: boolean
};

export type SessionEvent =
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
  | { type: 'REQUEST_CREATE_TIMER' }
  | { type: 'FROM_CRUD_DOCS_CREATED'; timer: Timer }
  | { type: 'SPAWN_TIMERS'; docs: Timer[] }


export const sessionMachine = (
  session: Session,
) =>
  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGICqACgCICCAKgKID6AyhTTQJIDyAcgNoAMAuoqAA4Z0AF0xY+IAJ6IAtACYAbHIB0AVgA0IAB6JVcgCzKF+zktUBfc5pSx02ZQDMATmDDKbdrMrQQANmBwAMQAlZgBZKgBhAAlGABkiYIpWKkDGVkYaaKoyRjCKYK5eJBBBETEJHQQZVQBGQ319VQBmetqAdn0ADgBOdrlNaQQOruUu5vba+qb9HrlOfUtrVDFHFzcPVZ9-HBiSVgBxalyyOIoiiTK0UWxK2TqGptb9Du6+galEVtUxianG1SzeaLKwgTb2ZyuZQANzQYAA7t4-AEyMwDgczrRGEQKAB1EgATRoFxKVxu4hKQzktRUzT+00BcwWmiqNXqygBz1evX6SzBKwh6xhcMR2xRaIx1DCzFIcRJAiE1wqJVZDw5TzanR5HypnV+kwZQIWfPBXkhblhCOUAFsMBAAIa+HCo9GY6Wy+WlRXku7VNWczVvfqDL4TZR0g0Ao0g5a2Vbm4VW9AQBH2ySwZ0St0ykhyniXb3K0Cq0zKdrtZr6Zo9bnvDSfBDVnr6-4zJkx-lxwVQy2I5Op9OZ13UJg4-FEz1kovae6l8uV6u1-r1ob6JTh+lR9smgVeNBYYRgJzQx1InbMAjJHJ5ApUd25yeF24q2R02rhrqcOTtLpTGmNfQQ2GWoFGbBROBAgw5EUCZeVBU1vAPI8T18M8AhCcIoliBIkhSNIMiya98kKfNSSfCli1kTpDDpUwJlUfoFAY9ogNqThVFGJiOIUHiXnqBQdy7PckOPU8xRwGgyBIYIyCIgpH3KZ9KL9VplB6OpWlqFoGK6PQgPU99VD6LoFHLOQujkd5BM8RDD1E1DxIvK9JPITJckiYlSIVRSKJnao2jULTywUZolAMdoeKA9pVB+foXmihQpnaThy2srYRJQ5RRGtI8wjtR1djiZg6Dk4I7xzPNim8pUlL8mRmhij8emMpoYr0QCGxpBRRiaDov2guZ1PaNL7H3OzMtgYR7VESa0AAYwzSIipKlzckkxgPIUmrfNZeofgajpal-czZjpKKjuUOQdJrdT9GgkDLFBLA7TgCRTQLHzfRkEyfgDeKgx1WR+OUSCuk6GLop6XoRrNdYPu2r7f3adUWkDbUgJqTilDB5oUv6I7Qo7BCE3esjPpfaoIubP6l0BhBzJbK7xg6K7amaGG1ihBCxXhn0KZkfGUa5LV3lYkCN0jNtgQ5hNe156dWSpoW0dFzqDEZjjWmXB74N3TmLRFND5dqxXqWV-70YbalaU3KXjV1oT9cTRFbQdXxjZ2qizZpkXgwbSsFBbQ1twdmzZcN-t4TTeAyYR-nBZ9gGgO6d8I1bRlpdD9LxsdD2vvaOYNzo6LGOYoCQs4MsGJ6Tg6VaL8Qo5sbkLE5E8-53HmjLT8lB-O7kpCjqhgsrutUhms2vUpuMtPbLcvy93Y755T6ppNQelxnoQpaThODB1iTB+PqjPmXpGk6aec9QybprQWaFvb5T-2UThjL6O7WlAyYgJHstunHrSMUp6PSAA */

  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGICqACgCICCAKgKID6AyhTTQJIDyAcgNoAMAuoqAA4Z0AF0xY+IAJ6IAtACYAbHIB0AVgA0IAB6JVcgCzKF+zktUBfc5pSx02ZQDMATmDDKAbmjAB3ZWggANmA4ZMwA4mEAMtRMRBQA6iQAmjRcvEgggiJiEjoIMqoAjIb6+qoAzMWFAOz6ABwAnNVymtIIcoUq5eXVhcVl+g1ynPqW1qhiji5unj5+gcGhEdFUALLMpJFpEllooti5skUlZZX6NfVNLVKIcrXKdT19paqDw6NWIDZ2WFOuHl5fABbDAQACGARC4Si1HWm22GV2+3EGTyBWKyheZwujWarUQ3WqykJzwGQxGYy+E3szn+s186AgPjBklgUOWsI2JC2PB2Qj2OVRR1Mymq1XK+nKDRxVw0NwQUoaDye-Ve5I+41sk1pM0BykZzNZ7JhtEYcUSKQRAn5yMO+VUIrFEqlMuacra+iUxJVLzeFM+30maCwwjATncEPmQRwzAIFFYVDIjFWFAASmsuTz0tbsgchfluoViXVOHc6n1OqV9PiEH0FEqFJxCkp9HJFD1mpTA-Zg6Hw5H-NGAGKp5irKgAYQAEoxIkRU-GqEPGKxGDQp4nk2mrZkbYLQGjaoZuqYeqpmgpz9Ua4VOKo6kZVPeFC-zsUFF3qb9e2GIwEo8ENBkCQqZkJuKapjuSL7toRyVMoDRFJUhQVOedR6DWiFFqoTR1AoYpyHUchXJ+Wo9iGv4DgsMZxgmQHkGuSYTqkvKInueYHrIVRqChYoKOUSgGNUL41tUT6igYNSqAofTVJwYqkT8fgUf2-6iECYarKCEI4BOkTMHQ4Fphm8KsTmAocbBBbieUjS4WUT56NW8qdAoD5lDUpZtkMiHVIpQYqX++rCGCoiwKIADGbJ6QZMTAUmQGMMxUHsSinH5MUqjEkUvTloRgzdKJhQPnIaHSohrYdB+lJYKCcASN2aW7rmTVonhWVYlUtS4tcbQFJwyjNoRxh3MVDrGBqVJkb8Op8i1doyOWRKdec3VXDWPTer0PTDOhxENP5NLTACPhzRZrWyMJSora6vWIJWyq9KVjw1KVzaHTNx30gBZ22vmMjNEWN1rXi8odF0Ppku8H1-LqcwguCAS-TBh4dJipxdZcoNtBKCiPaSarQwGX6wydDL+Ia8BsfN-2A+jFSYz1Nb1EWJKqn6k2NcpfZ-sjlmHkM3qnmJF5XjW-EDSLDScN0lSlvxMM-qpP3U+dC3lDLoolko1R1K2cn8c5bREeUor1GJDTSo5iGK4FkbqZp2lI6rf3pTIlQqDhGsNPxFScJwdTXi5JhZZ5OG7Q0pS1LbPORuFoVoOFaBRXzF21gYyicLhTStpU9a9DWJtm4HOFW0+NuWOYQA */

  /** @xstate-layout N4IgpgJg5mDOIC5SzrAlgewHYGICqACgCICCAKgKID6AyhTTQJIDyAcgNoAMAuoqAA4Z0AF0xY+IAJ6IAtACYAbHIB0AVgA0IAB6JVcgCzKF+zktUBfc5pSx02ZWizCwAJwBuAQwA2DiF7A4zAQUrFRkjACyFABKVBHMpAAyXLxIIIIiYhI6CDIAzHkAjMp5AByccgDspYW1Bvr6mtIItQoAnEachUr6cop5lZVyltaoYg5Orp4+aH4BAGLRzBFUAMIAEoyJRNEhVPOMrIw062GRMSkSGWii2NmylQ0leaYDqkMK75VNiIWcqqUjKoAQpQfpavoFCMQDY7FgJs53N5fP4cDQyCRomQzlFopc0tdbuI0jkZKoiso2qpCkVCuT3qU9D8EFTiqo2tUFIM5KU5BzhlYYWN7I5EdMUQEgnt0eRjuFVjR8QIhDcsiTZIVwWo6YMFHklAZKqDmZVgcohuDTQpapVOINobDxqKpsjRABbVwRDAQbw4VaJZh0HExOIJEjJHhXFVE+65PJmsptDmlfTA4EGZmFRSA1OFW19Pl894O4Xw51InywYQeURVtAAY1gfoDQZl4XRjAVSvS0bVoFJmtUJWplUKNR5+jaBRNY+UcgZbUKVN6cm6lkFWG9cAkjruBN7e-7shTnGer1NHy+zNU+jyc-ebS6jNMqdKJdsTsmFajmUP2gebQqAU57vIoV5SIgeqnhej4FEUFR6u+cIIi6MxzD+qp-qSLx3tUphVCmVSvI0EEILyuH6KUppJnSwJUkhn5iq6aAei4Xo+l4GExuqcZZmoU6cG0erkpwnBUZmJhDnm-yAWJbQNI8DEil+4pVjWaB1o2XF9v+LQGMognVByvRFO0o7MuR5qUdRi5pvR65AA */
  createMachine({
    context: {
      session,
      _id: session._id,
      title: session.title,
      timersQueue: [],
      currentTimerIdx: 0,
      totalGoal: 0,
      selectedTimer: undefined,
      loop: 0,
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
      }
    },
  }, {
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
        selectedTimer: (_, event) => event.timer,
      }),
      clearSelectedTimerId: assign({
        selectedTimer: (_) => undefined,
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
      // collapseTimers: pure((context) =>
      //   context.timersQueue.map((myActor) => send('COLLAPSE', { to: myActor }))
      // ),
      // openTimers: pure((context) =>
      //   context.timersQueue.map((myActor) => send('OPEN', { to: myActor }))
      // ),
    },
  });

export type SessionMachine = typeof sessionMachine;
