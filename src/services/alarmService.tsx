import alarm from '../assets/alarm10.wav';
import digitalAlarm from '../assets/digital_alarm.mp3';
import festiveBells from '../assets/festive_bells.mp3';
import highPitchAlarm from '../assets/high_pitch_alarm.mp3';

const alarmNames = [
  'alarm',
  'digital_alarm',
  'festive_bells',
  'high_pitch_alarm',
] as const;

export type AlarmName = typeof alarmNames[number];

type Sound = typeof alarm | typeof digitalAlarm;

const alarmDictionary: Record<AlarmName, Sound> = {
  alarm,
  digital_alarm: digitalAlarm,
  festive_bells: festiveBells,
  high_pitch_alarm: highPitchAlarm
}

export const getAlarm = (s: AlarmName): Sound => {
  const sound = alarmDictionary[s];
  return sound ?? alarm;
};