// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.after(100)#(machine).running": {
      type: "xstate.after(100)#(machine).running";
    };
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
    pauseTimer: "PAUSE";
    playSound: "xstate.after(100)#(machine).running";
    resetTimer: "RESET";
    resumeTimer: "RESUME";
    startTimer: "START";
    updateAfter100Milliseconds: "xstate.after(100)#(machine).running";
    updateTimerFromInput: "UPDATE";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: "idle" | "paused" | "running";
  tags: never;
}
