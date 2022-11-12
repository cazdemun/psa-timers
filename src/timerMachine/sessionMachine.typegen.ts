// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingActions: {
    advanceCurrentTimerIdx: "FROM_CHILDREN_FINISH_TIMER";
    collapseTimers: "COLLAPSE_TIMERS";
    openTimers: "OPEN_TIMERS";
    removeTimer: "REMOVE_TIMER";
    restartSession: "RESTART_SESSION";
    sendFinishTimerUpdate: "FROM_CHILDREN_FINISH_TIMER";
    spawnFirstTimer: "";
    spawnTimer: "ADD";
    startNextTimer: "FROM_CHILDREN_FINISH_TIMER";
    updateTitle: "CHANGE_TITLE";
    updateTotalGoal: "UPDATE_TOTAL_GOAL";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | "free"
    | "free.session"
    | "free.session.idle"
    | "free.view"
    | "free.view.idle"
    | "free.view.modal"
    | "free.view.sideways"
    | "interval"
    | "interval.idle"
    | "interval.running"
    | "start"
    | {
        free?:
          | "session"
          | "view"
          | { session?: "idle"; view?: "idle" | "modal" | "sideways" };
        interval?: "idle" | "running";
      };
  tags: never;
}
