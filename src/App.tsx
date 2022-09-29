import React from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import './App.css';
import { timerMachine } from './timerMachine/timerMachine';

const normalizeNumbers = (n: number): number => n < 0 ? 0 : n;
const padNumbers = (n: number, padding: number = 2): string => n < (10 ** (padding - 1)) ? `${Array(padding).join('0')}${n}` : `${n}`;

export const formatSecondsHHmm = (n: number) => {
  const seconds = padNumbers(normalizeNumbers(n % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / 60)));
  return `${minutes}:${seconds}`
}

const formatMillisecondsHHmmsss = (n: number) => {
  const milliseconds = padNumbers(normalizeNumbers(n % 1000), 3);
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000))));
  return `${minutes}:${seconds}:${milliseconds}`
}

function App() {
  const timerService = useInterpret(timerMachine);
  const timerValue = useSelector(timerService, ({ value }) => value);
  const millisecondsLeft = useSelector(timerService, ({ context }) => context.milliSecondsLeft);

  return (
    <>
      {timerValue}
      <p>{formatMillisecondsHHmmsss(millisecondsLeft)}</p>
      <button onClick={() => timerService.send({
        type: 'START',
        initialMilliSeconds: 10 * 1000
      })}>Start</button>
    </>
  );
}

export default App;
