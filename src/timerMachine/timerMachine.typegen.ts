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
    resetTimer: "RESET" | "START" | "UPDATE";
    updateAfter100Milliseconds: "xstate.after(100)#(machine).running";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: "paused" | "running";
  tags: never;
}
