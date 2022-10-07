import React, { ReactNode } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import { SessionManagerMachine } from './timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmssSSS, mmssToMilliseconds } from './utils';
import TimerView from './pages/TimerView';

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
                <TimerView timer={t} isCurrent={currentTimerIdx === i} />
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
