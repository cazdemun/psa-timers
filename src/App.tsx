import React, { ReactNode, useState } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { TimerMachine } from './timerMachine/timerMachine';
import { format, parse } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import { sessionMachine } from './timerMachine/sessionMachine';
import alarm from './assets/alarm10.wav';

import './App.css';

const normalizeNumbers = (n: number): number => n < 0 ? 0 : n;
const padMilliseconds = (n: number): string => {
  if (n < 10) return `00${n}`;
  if (n < 100) return `0${n}`;
  return `${n}`;
};
const padNumbers = (n: number, padding: number = 2): string => n < (10 ** (padding - 1)) ? `${Array(padding).join('0')}${n}` : `${n}`;

export const formatSecondsmmss = (n: number) => {
  const seconds = padNumbers(normalizeNumbers(n % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / 60)));
  return `${minutes}:${seconds}`
}

export const formatMillisecondsmmss = (n: number) => {
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000))));
  return `${minutes}:${seconds}`
}

// Not havin a mod in minutes is intentional
const formatMillisecondsmmssSSS = (n: number) => {
  const milliseconds = padMilliseconds(normalizeNumbers(n % 1000));
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000))));
  return `${minutes}:${seconds}:${milliseconds}`
}

const formatMillisecondsHHmmssSSS = (n: number) => {
  const milliseconds = padMilliseconds(normalizeNumbers(n % 1000));
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000) % 60)));
  const hours = padNumbers(normalizeNumbers(Math.floor(n / (60 * 60 * 1000))));
  return `${hours}:${minutes}:${seconds}:${milliseconds}`
}

const validateInput = (testdate: string) => {
  var date_regex = /^[0-5]\d:[0-5]\d$/;
  return date_regex.test(testdate);
}

const mmssToMilliseconds = (s: string) => parse(s, 'mm:ss', new Date(0)).getTime();

const presets = [...Array(12).keys()].map((i) => ({
  milliseconds: (i + 1) * 60 * 1000,
  label: formatMillisecondsmmss((i + 1) * 60 * 1000),
}));


const Timer = ({ timer, isCurrent = false }: { timer: ActorRefFrom<TimerMachine>, isCurrent?: boolean }) => {
  const [timerState, timerSend] = useActor(timer);
  const timerValue = timerState.value;
  const running = timerState.matches('running');
  const paused = timerState.matches('paused');
  const idle = timerState.matches('idle');
  const finalTime = timerState.context.finalTime;
  const millisecondsLeft = timerState.context.millisecondsLeft;
  const millisecondsOriginalGoal = timerState.context.millisecondsOriginalGoal;

  const showFinalTime = idle && finalTime;

  const [startTimeString, setstartTimeString] = useState<string>(formatMillisecondsmmss(millisecondsOriginalGoal));
  const [startTimeError, setstartTimeStringError] = useState<string>('');

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid black',
        paddingLeft: '24px',
        paddingBottom: '24px',
      }}
    >
      <div style={{ flex: '1' }}>
        <h2>{`Timer (${timerValue}) ${isCurrent ? '★' : ''}`}</h2>
        <p style={(running || showFinalTime) ? { marginBottom: '0px' } : undefined}>{formatMillisecondsmmssSSS(millisecondsLeft)}</p>
        {running && <p style={{ marginTop: '0', fontSize: '12px' }}>Ends on: {format(Date.now() + millisecondsLeft, 'HH:mm:ss aaaa')}</p>}
        {showFinalTime && <p style={{ marginTop: '0', fontSize: '12px' }}>Ended on: {format(finalTime, 'HH:mm:ss aaaa')}</p>}
        {idle && (
          <button
            disabled={startTimeError !== ''}
            onClick={() => {
              if (startTimeError === '') {
                timerSend({
                  type: 'START',
                  newMillisecondsGoals: mmssToMilliseconds(startTimeString),
                })
              }
            }}
          >
            Start
          </button>
        )}
        {paused && (
          <button onClick={() => timerSend({ type: 'RESUME' })}>
            Resume
          </button>
        )}
        {running && (
          <button onClick={() => timerSend({ type: 'PAUSE' })}>
            Pause
          </button>
        )}
        {(running || paused) && (
          <button onClick={() => timerSend({ type: 'RESET' })}>
            {`${running ? '(Soft)' : '(Hard)'} Reset ${formatMillisecondsmmss(millisecondsOriginalGoal)}`}
          </button>
        )}
        {idle && (
          <input
            disabled={!idle}
            value={startTimeString}
            onChange={(e) => {
              if (validateInput(e.target.value)) {
                setstartTimeString(e.target.value);
                setstartTimeStringError('');
                timerSend({
                  type: 'UPDATE',
                  newMillisecondsGoals: mmssToMilliseconds(e.target.value),
                });
              } else {
                setstartTimeString(e.target.value);
                setstartTimeStringError('error parsing mm:ss');
              }
            }}
          />
        )}
        {startTimeError !== '' && <p style={{ color: 'red', margin: '0' }}>{startTimeError}</p>}
        <br />
        <button onClick={() => (new Audio(alarm)).play()}>
          Play sound!
        </button>
      </div>
      <div style={{ flex: '1' }}>
        <h2>Presets</h2>
        <span
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: '200px',
          }}
        >
          {presets.map((i) => (
            <button
              key={i.milliseconds.toString()}
              disabled={!idle}
              style={{
                flex: 'none',
              }}
              onClick={() => {
                setstartTimeString(i.label);
                setstartTimeStringError('');
                timerSend({
                  type: 'UPDATE',
                  newMillisecondsGoals: i.milliseconds,
                });
              }}
            >
              {i.label}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}

const AppContainer = ({ children }: { children?: ReactNode }) => (
  <div style={{ display: 'flex' }}>
    <div style={{ margin: '18px' }} />
    <div style={{ flex: '5' }} >
      {children}
    </div>
    <div style={{ flex: '1' }} />
  </div>
)
function App() {
  const sessionService = useInterpret(sessionMachine);
  const timers = useSelector(sessionService, ({ context }) => context.timersQueue);
  const totalGoal = useSelector(sessionService, ({ context }) => context.totalGoal);
  const currentTimerIdx = useSelector(sessionService, ({ context }) => context.currentTimerIdx);

  return (
    <AppContainer>
      <br />
      <p>{`TotalSessionTime : ${formatMillisecondsHHmmssSSS(totalGoal)}`}</p>
      <button onClick={() => sessionService.send({ type: 'ADD' })}>
        Add timer
      </button>
      <br />
      <br />
      <div style={{ display: 'flex' }}>
        <div style={{ flex: '6' }} >
          {timers.map((t, i) => <Timer key={i.toString()} timer={t} isCurrent={currentTimerIdx === i} />)}
        </div>
        <div style={{ flex: '7' }} />
      </div>
      <h2>Notes</h2>
      <ul>
        <li>Soft reset restarts the timer when is running and keeps going</li>
        <li>Hard reset restarts the timer when is paused and stops it, allowing new input</li>
      </ul>
      <p>Disclaimer: sound belongs to Microsoft</p>
    </AppContainer>
  );
}

export default App;
