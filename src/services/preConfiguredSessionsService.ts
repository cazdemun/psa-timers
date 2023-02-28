import { v4 as uuidv4 } from 'uuid';
import { ActorRefFrom } from 'xstate';
import { SessionCRUDStateMachine, TimerCRUDStateMachine } from '../machines/v2/appService';
import { Session, Timer } from '../models';
import { NewDoc } from '../lib/RepositoryV3';

export const addNewUserSessions = (
  SessionCRUDService: ActorRefFrom<SessionCRUDStateMachine>,
  TimerCRUDService: ActorRefFrom<TimerCRUDStateMachine>,
): void => {
  // Classic
  const classicSessionId = uuidv4();

  const classicSessionTimers: Timer[] = [
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "1.1",
      label: 'Inhale',
      sessionId: classicSessionId,
      sound: 'exhale_alarm',
      duration: 8000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "1.2",
      label: 'Exhale (close eyes)',
      sessionId: classicSessionId,
      sound: 'high_pitch_alarm',
      duration: 8000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "1.3",
      label: 'Task',
      sessionId: classicSessionId,
      sound: 'festive_bells',
      duration: 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "1.4",
      label: 'Reward',
      sessionId: classicSessionId,
      sound: 'inhale_alarm',
      duration: 20000,
      saveRecord: false,
    },
  ];

  const classicSession: NewDoc<Session> = {
    _id: classicSessionId,
    created: Date.now(),
    index: '1',
    timers: classicSessionTimers.map((timer) => timer._id),
    title: 'Classic',
    sound: 'inhale_alarm',
  }

  // Only breathing
  const onlyBreathingSessionId = uuidv4();

  const onlyBreathingTimers: Timer[] = [
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "2.1",
      label: 'Inhale',
      sessionId: onlyBreathingSessionId,
      sound: 'exhale_alarm',
      duration: 10000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "2.2",
      label: 'Exhale (close eyes)',
      sessionId: onlyBreathingSessionId,
      sound: 'inhale_alarm',
      duration: 10000,
      saveRecord: false,
    },
  ];

  const onlyBreathingSession: NewDoc<Session> = {
    _id: onlyBreathingSessionId,
    created: Date.now(),
    index: '2',
    timers: onlyBreathingTimers.map((timer) => timer._id),
    title: 'Only Breathing',
    sound: 'inhale_alarm',
  }

  // Only work
  const onlyWorkSessionId = uuidv4();

  const onlyWorkSessionTimers: Timer[] = [
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "3.1",
      label: 'Task',
      sessionId: onlyWorkSessionId,
      sound: 'festive_bells',
      duration: 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "3.2",
      label: 'Reward',
      sessionId: onlyWorkSessionId,
      sound: 'high_pitch_alarm',
      duration: 20000,
      saveRecord: false,
    },
  ];

  const onlyWorkSession: NewDoc<Session> = {
    _id: onlyWorkSessionId,
    created: Date.now(),
    index: '3',
    timers: onlyWorkSessionTimers.map((timer) => timer._id),
    title: 'Only Work',
    sound: 'high_pitch_alarm',
  }

  // Lite Pomodoro
  const litePomodoroSessionId = uuidv4();

  const litePomodoroTimers: Timer[] = [
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.1",
      label: 'Work',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 12 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.2",
      label: 'Rest',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 2 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.3",
      label: 'Work',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 12 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.4",
      label: 'Rest',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 2 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.5",
      label: 'Work',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 12 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.6",
      label: 'Rest',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 2 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.7",
      label: 'Work',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 12 * 60 * 1000 + 30000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.8",
      label: 'Big Rest',
      sessionId: litePomodoroSessionId,
      sound: 'beep_alarm',
      duration: 5 * 60 * 1000,
      saveRecord: false,
    },
  ];

  const litePomodoroSession: NewDoc<Session> = {
    _id: litePomodoroSessionId,
    created: Date.now(),
    index: '4',
    timers: litePomodoroTimers.map((timer) => timer._id),
    title: 'Lite Pomodoro',
    sound: undefined,
  }

  // Pomodoro
  const pomodoroSessionId = uuidv4();

  const pomodoroTimers: Timer[] = [
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.1",
      label: 'Work',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 25 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.2",
      label: 'Rest',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 5 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.3",
      label: 'Work',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 25 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.4",
      label: 'Rest',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 5 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.5",
      label: 'Work',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 25 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.6",
      label: 'Rest',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 5 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.7",
      label: 'Work',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 25 * 60 * 1000,
      saveRecord: false,
    },
    {
      _id: uuidv4(),
      created: Date.now(),
      index: "4.8",
      label: 'Big Rest',
      sessionId: pomodoroSessionId,
      sound: 'beep_alarm',
      duration: 15 * 60 * 1000,
      saveRecord: false,
    },
  ];

  const pomodoroSession: NewDoc<Session> = {
    _id: pomodoroSessionId,
    created: Date.now(),
    index: '5',
    timers: pomodoroTimers.map((timer) => timer._id),
    title: 'Pomodoro',
    sound: undefined,
  }

  SessionCRUDService.send({
    type: 'CREATE',
    doc: [
      classicSession,
      onlyBreathingSession,
      onlyWorkSession,
      litePomodoroSession,
      pomodoroSession,
    ]
  })

  TimerCRUDService.send({
    type: 'CREATE',
    doc: [
      ...classicSessionTimers,
      ...onlyBreathingTimers,
      ...onlyWorkSessionTimers,
      ...litePomodoroTimers,
      ...pomodoroTimers,
    ]
  })
}
