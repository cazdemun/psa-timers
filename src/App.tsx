import React, { useState } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import './App.css';
import { timerMachine } from './timerMachine/timerMachine';
import { parse } from 'date-fns';

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
  const millisecondsLeft = useSelector(timerService, ({ context }) => context.milliSecondsLeft);

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
                initialMilliSeconds: mmssToMilliseconds(startTimeString),
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
      <input
        value={startTimeString}
        onChange={(e) => {
          if (validateInput(e.target.value)) {
            setstartTimeString(e.target.value)
            setstartTimeStringError('')
            timerService.send({
              type: 'UPDATE',
              initialMilliSeconds: mmssToMilliseconds(e.target.value),
            })
          } else {
            setstartTimeString(e.target.value)
            setstartTimeStringError('error parsing mm:ss')
          }
        }}
      />
      {startTimeError !== '' && <p style={{ color: 'red' }}>{startTimeError}</p>}
    </>
  );
}

export default App;
