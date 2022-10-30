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
    advanceCurrentTime: "FINISH_TIMER";
    collapseTimers: "COLLAPSE_TIMERS";
    openTimers: "OPEN_TIMERS";
    removeTimer: "REMOVE_TIMER";
    restartSession: "RESTART_SESSION";
    sendFinishTimerUpdate: "FINISH_TIMER";
    spawnFirstTimer: "";
    spawnTimer: "ADD";
    updateTitle: "CHANGE_TITLE";
    updateTotalGoal: "UPDATE_TOTAL_GOAL";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | "session"
    | "session.idle"
    | "session.start"
    | "view"
    | "view.idle"
    | "view.modal"
    | "view.sideways"
    | { session?: "idle" | "start"; view?: "idle" | "modal" | "sideways" };
  tags: never;
}
