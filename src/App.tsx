import React, { useState } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import './App.css';
import { timerMachine } from './timerMachine/timerMachine';
import { format, parse } from 'date-fns';

import alarm from './assets/alarm10.wav';

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

const formatMillisecondsmmssSSS = (n: number) => {
  const milliseconds = padMilliseconds(normalizeNumbers(n % 1000));
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000))));
  return `${minutes}:${seconds}:${milliseconds}`
}

const validateInput = (testdate: string) => {
  var date_regex = /^[0-5]\d:[0-5]\d$/;
  return date_regex.test(testdate);
}

const mmssToMilliseconds = (s: string) => parse(s, 'mm:ss', new Date(0)).getTime();

const INITIAL_TIME = '00:10';
const INITIAL_MILLISECONDS = mmssToMilliseconds(INITIAL_TIME);

function App() {
  const timerService = useInterpret(timerMachine(INITIAL_MILLISECONDS));
  const timerValue = useSelector(timerService, ({ value }) => value);
  const running = useSelector(timerService, (state) => state.matches('running'));
  const paused = useSelector(timerService, (state) => state.matches('paused'));
  const idle = useSelector(timerService, (state) => state.matches('idle'));
  const millisecondsLeft = useSelector(timerService, ({ context }) => context.millisecondsLeft);
  const millisecondsOriginalGoal = useSelector(timerService, ({ context }) => context.millisecondsOriginalGoal);

  const [startTimeString, setstartTimeString] = useState<string>(INITIAL_TIME);
  const [startTimeError, setstartTimeStringError] = useState<string>('');


  return (
    <>
      {timerValue}
      <p>{formatMillisecondsmmssSSS(millisecondsLeft)}</p>
      {idle && (
        <button
          onClick={() => {
            if (startTimeError === '') {
              timerService.send({
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
        <button
          onClick={() => timerService.send({ type: 'RESUME' })}
        >
          Resume
        </button>
      )}
      {running && (
        <button
          onClick={() => timerService.send({ type: 'PAUSE' })}
        >
          Pause
        </button>
      )}
      {(running || paused) && (
        <button
          onClick={() => timerService.send({ type: 'RESET' })}
        >
          {`${running ? '(Soft)' : '(Hard)'} Reset ${formatMillisecondsmmss(millisecondsOriginalGoal)}`}
        </button>
      )}
      {idle && (
        <input
          value={startTimeString}
          onChange={(e) => {
            if (validateInput(e.target.value)) {
              setstartTimeString(e.target.value)
              setstartTimeStringError('')
              timerService.send({
                type: 'UPDATE',
                newMillisecondsGoals: mmssToMilliseconds(e.target.value),
              })
            } else {
              setstartTimeString(e.target.value)
              setstartTimeStringError('error parsing mm:ss')
            }
          }}
        />
      )}
      {startTimeError !== '' && <p style={{ color: 'red' }}>{startTimeError}</p>}
      <br />
      <button onClick={() => (new Audio(alarm)).play()}>
        Play sound!
      </button>
      {running && <p>Ends on: {format(Date.now() + millisecondsLeft, 'HH:mm:ss aaaa')}</p>}
      <p>Soft reset restarts the timer when is running and keeps going</p>
      <p>Hard reset restarts the timer when is paused and stops it, allowing new input</p>
      <p>Disclaimer: sound belongs to Microsoft</p>
    </>
  );
}

export default App;
