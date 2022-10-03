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
    removeTimer: "REMOVE_TIMER";
    restartSession: "RESTART_SESSION";
    spawnFirstTimer: "";
    spawnTimer: "ADD";
    updateTitle: "CHANGE_TITLE";
    updateTotalGoal: "UPDATE_TOTAL_GOAL";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: "idle" | "start";
  tags: never;
}
