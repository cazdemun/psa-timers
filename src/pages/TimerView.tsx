import React, { useState } from 'react';
import { useActor } from '@xstate/react';
import { format } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import alarm from '../assets/alarm10.wav';
import { TimerMachine } from '../timerMachine/timerMachine';
import { formatMillisecondsmmss, formatMillisecondsmmssSSS, mmssToMilliseconds, validateInput } from '../utils';

const presets = [...Array(12).keys()].map((i) => ({
  milliseconds: (i + 1) * 60 * 1000,
  label: formatMillisecondsmmss((i + 1) * 60 * 1000),
}));

const TimerView = ({ timer, isCurrent = false }: { timer: ActorRefFrom<TimerMachine>, isCurrent?: boolean }) => {
  const [timerState, timerSend] = useActor(timer);
  const timerValue = timerState.value;
  const running = timerState.matches('running');
  const paused = timerState.matches('paused');
  const idle = timerState.matches('idle');
  const finalTime = timerState.context.finalTime;
  const millisecondsLeft = timerState.context.millisecondsLeft;
  const millisecondsOriginalGoal = timerState.context.millisecondsOriginalGoal;
  const millisecondsInput = timerState.context.millisecondsInput;

  const showFinalTime = idle && finalTime;

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
                  newMillisecondsGoals: mmssToMilliseconds(millisecondsInput),
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
            value={millisecondsInput}
            onChange={(e) => {
              if (validateInput(e.target.value)) {
                setstartTimeStringError('');
                timerSend({
                  type: 'UPDATE',
                  newMillisecondsGoals: e.target.value,
                });
              } else {
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
                setstartTimeStringError('');
                timerSend({
                  type: 'UPDATE',
                  newMillisecondsGoals: i.label,
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

export default TimerView;