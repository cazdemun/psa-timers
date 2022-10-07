import React, { ReactNode, useState } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { TimerMachine } from './timerMachine/timerMachine';
import { format } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import alarm from './assets/alarm10.wav';

import './App.css';
import { SessionManagerMachine } from './timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmssSSS, formatMillisecondsmmss, formatMillisecondsmmssSSS, mmssToMilliseconds } from './utils';


const validateInput = (testdate: string) => {
  var date_regex = /^[0-5]\d:[0-5]\d$/;
  return date_regex.test(testdate);
}

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

// const SessionView = ({ session, updateSession, deleteSession }
//   : { session: Session, updateSession: (s: Session) => any, deleteSession: (s: string) => any }) => {
//   const sessionService = useInterpret(sessionMachine(session._id, session.title, session.timers));

//   const _id = useSelector(sessionService, ({ context }) => context._id);
//   const title = useSelector(sessionService, ({ context }) => context.title);
//   const timers = useSelector(sessionService, ({ context }) => context.timersQueue);

//   const totalGoal = useSelector(sessionService, ({ context }) => context.totalGoal);
//   const currentTimerIdx = useSelector(sessionService, ({ context }) => context.currentTimerIdx);

const SessionView = ({ session, updateSession, deleteSession }
  : { session: ActorRefFrom<typeof sessionMachine>, updateSession: (s: Session) => any, deleteSession: (s: string) => any }) => {
  const [sessionState, sessionSend] = useActor(session);

  const _id = sessionState.context._id;
  const title = sessionState.context.title;
  const timers = sessionState.context.timersQueue;

  const totalGoal = sessionState.context.totalGoal;
  const currentTimerIdx = sessionState.context.currentTimerIdx;

  return (
    <>
      <br />
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <p style={{ flex: 'none', margin: '0px' }}>{`${_id} - Title: `}</p>
        <span style={{ flex: 'none', width: '18px' }} />
        <input
          style={{ flex: 'none' }}
          value={title}
          onChange={(e) => sessionSend({
            type: 'CHANGE_TITLE',
            title: e.target.value,
          })}
        />
      </div>
      <p>{`TotalSessionTime : ${formatMillisecondsHHmmssSSS(totalGoal)}`}</p>
      <button onClick={() => sessionSend({ type: 'ADD' })}>
        Add timer
      </button>
      <button onClick={() => sessionSend({ type: 'RESTART_SESSION' })}>
        Restart session
      </button>
      <button onClick={() => updateSession({
        _id,
        title,
        timers: timers.map((t) => mmssToMilliseconds(t.getSnapshot()?.context.millisecondsInput ?? '00:00'))
      })}>
        Save session
      </button>
      <button onClick={() => deleteSession(_id)}>
        Delete session
      </button >
      <br />
      <br />
      <div style={{ display: 'flex' }}>
        <div style={{ flex: '6' }} >
          {timers.map((t, i) => (
            <div key={i.toString()} style={{ display: 'flex' }}>
              <div style={{ flex: '1' }}>
                <Timer timer={t} isCurrent={currentTimerIdx === i} />
              </div>
              <button
                style={{ flex: 'none' }}
                onClick={() => sessionSend({ type: 'REMOVE_TIMER', timerId: t.id })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div style={{ flex: '7' }} />
      </div>
    </>
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
  const sessionManagerService = useInterpret(SessionManagerMachine);
  const sessionCRUD = useSelector(sessionManagerService, ({ context }) => context.sessionCRUDMachine);
  const [sessionCRUDState, sessionCRUDSend] = useActor(sessionCRUD);
  const sessions = useSelector(sessionManagerService, ({ context }) => context.sessions);

  return (
    <AppContainer>

      <button
        onClick={() => sessionCRUDSend({
          type: 'CREATE',
          doc: {
            timers: [10000],
            title: 'New Timer',
          },
        })}
      >
        {`Create Session (${sessionCRUDState.context.docs.length})`}
      </button>
      {sessions
        .map((s, i) => (
          <SessionView
            key={i.toString()}
            session={s}
            updateSession={(s) => sessionCRUDSend({
              type: 'UPDATE',
              _id: s._id,
              doc: s
            })}
            deleteSession={(s) => sessionCRUDSend({
              type: 'DELETE',
              _id: s,
            })}
          />
        ))}
      <h2>Notes</h2>
      <ul>
        <li>Soft reset restarts the timer when is running and keeps going</li>
        <li>Hard reset restarts the timer when is paused and stops it, allowing new input</li>
      </ul>
      <p>Disclaimer: sound belongs to Microsoft</p>
    </AppContainer >
  );
}

export default App;
