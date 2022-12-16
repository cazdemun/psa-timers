
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "advanceCurrentTimerIdx": "FROM_CHILDREN_FINISH_TIMER";
"clearSelectedTimerId": "CLOSE_TIMER_MODAL";
"collapseTimers": "COLLAPSE_TIMERS";
"openTimers": "OPEN_TIMERS";
"removeTimer": "REMOVE_TIMER";
"restartSession": "RESTART_SESSION";
"saveSelectedTimerId": "OPEN_TIMER_MODAL";
"sendFinishTimerUpdate": "FROM_CHILDREN_FINISH_TIMER";
"spawnTimers": "SPAWN_TIMERS";
"startNextTimer": "FROM_CHILDREN_FINISH_TIMER";
"startTimer": "START_TIMER";
"updateLoop": "FROM_CHILDREN_FINISH_TIMER";
"updateTitle": "CHANGE_TITLE";
"updateTotalGoal": "FROM_CHILDREN_FINISH_TIMER" | "UPDATE_TOTAL_GOAL";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          
        };
        matchesStates: "free" | "free.session" | "free.session.idle" | "free.view" | "free.view.idle" | "free.view.modal" | "free.view.sideways" | "interval" | "interval.idle" | "interval.timerModal" | { "free"?: "session" | "view" | { "session"?: "idle";
"view"?: "idle" | "modal" | "sideways"; };
"interval"?: "idle" | "timerModal"; };
        tags: never;
      }
  