import oldAlarm from '../assets/alarm09.mp3';
import alarm from '../assets/alarm10.wav';
import digitalAlarm from '../assets/digital_alarm.mp3';
import festiveBells from '../assets/festive_bells.mp3';
import highPitchAlarm from '../assets/high_pitch_alarm.mp3';
import inhaleAlarm from '../assets/inhale.wav';
import exhaleAlarm from '../assets/exhale.wav';
import beepAlarm from '../assets/beep.mp3';

export const alarmNames = [
  'old_alarm',
  'alarm',
  'digital_alarm',
  'festive_bells',
  'high_pitch_alarm',
  'inhale_alarm',
  'exhale_alarm',
  'beep_alarm',
] as const;

export type AlarmName = typeof alarmNames[number];

type Sound = HTMLAudioElement;

const alarmDictionary: Record<AlarmName, Sound> = {
  old_alarm: new Audio(oldAlarm),
  alarm: new Audio(alarm),
  digital_alarm: new Audio(digitalAlarm),
  festive_bells: new Audio(festiveBells),
  high_pitch_alarm: new Audio(highPitchAlarm),
  inhale_alarm: new Audio(inhaleAlarm),
  exhale_alarm: new Audio(exhaleAlarm),
  beep_alarm: new Audio(beepAlarm),
}

export const getAlarm = (s: AlarmName) => {
  const sound = alarmDictionary[s];
  return sound ?? new Audio(alarm);
};
