import { AlarmName } from "../services/alarmService"

export type Timer = {
  _id: string
  created: number
  label: string
  index: string
  //
  sessionId: string
  originalTime: number // milliseconds
  saveRecord: boolean
  growRate: number
  sound: AlarmName
}

export type TimerRecord = {
  _id: string
  timerId: string
  sessionId: string
  originalTime: number  // milliseconds
  finalTime: number // milliseconds
  finished: number // timestamp milliseconds
};

export type Session = {
  _id: string
  created: number
  title: string
  index: string
  //
  sound?: AlarmName
}
