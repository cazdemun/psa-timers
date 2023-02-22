import React from 'react';
import { ActorRefFrom, InterpreterFrom } from 'xstate';
import { AppMachine, SessionCRUDMachine, TimerCRUDMachine, TimerRecordCRUDMachine } from '../machines/appMachine';

type GlobalServicesContextProps = {
  appService: InterpreterFrom<typeof AppMachine>
  sessionCRUDActor: ActorRefFrom<typeof SessionCRUDMachine>
  timerCRUDActor: ActorRefFrom<typeof TimerCRUDMachine>
  timerRecordCRUDActor: ActorRefFrom<typeof TimerRecordCRUDMachine>
}

export const GlobalServicesContext = React.createContext<GlobalServicesContextProps>({} as any);
