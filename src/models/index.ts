import { AlarmName } from "../services/alarmService"

export type Timer = {
  _id: string
  created: number
  label: string
  index: string
  //
  sessionId: string
  duration: number // milliseconds
  saveRecord: boolean
  growth?: {
    rate: number, // percentage
    min?: number, // milliseconds
    max?: number, // milliseconds
  }
  sound: AlarmName
}

export type TimerRecord = {
  _id: string
  timerId: string
  timerLabel: string // default when timer is deleted
  sessionId: string
  sessionTitle: string // default when session is deleted
  duration: number  // milliseconds
  finalDuration: number // milliseconds - may be equal to duration or not depending on timer's growth factor
  finished: number // timestamp milliseconds
};

export type Session = {
  _id: string
  created: number
  title: string
  index: string
  timers: string[]
  //
  sound?: AlarmName
}
