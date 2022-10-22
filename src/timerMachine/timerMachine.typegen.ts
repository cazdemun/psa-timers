// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.after(100)#timer.clock.running": {
      type: "xstate.after(100)#timer.clock.running";
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
    playSound: "xstate.after(100)#timer.clock.running";
    resetTimer: "RESET";
    resumeTimer: "RESUME";
    sendFinishUpdate: "xstate.after(100)#timer.clock.running";
    sendInputUpdate: "UPDATE";
    setFinishTimestamp: "xstate.after(100)#timer.clock.running";
    startTimer: "START";
    updateAfter100Milliseconds: "xstate.after(100)#timer.clock.running";
    updateTimerFromInput: "UPDATE";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | "clock"
    | "clock.idle"
    | "clock.paused"
    | "clock.running"
    | "view"
    | "view.collapsed"
    | "view.open"
    | { clock?: "idle" | "paused" | "running"; view?: "collapsed" | "open" };
  tags: never;
}
