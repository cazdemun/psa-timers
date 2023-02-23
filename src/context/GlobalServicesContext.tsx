import React from "react";
import { InterpreterFrom } from "xstate";
import { AppService } from "../machines/v2/appService";

/**
 * Potential variations of the GlobalConfig / setGlobalConfig
 */
const GlobalServicesContext = React.createContext<{
  service: InterpreterFrom<typeof AppService>
}>({} as any)

export default GlobalServicesContext;
