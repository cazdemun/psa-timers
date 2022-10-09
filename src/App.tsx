import React from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import { SessionManagerMachine } from './timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmssSSS, mmssToMilliseconds } from './utils';
import TimerView from './pages/TimerView';
import { Button, Col, Row } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const SessionView = ({ session, updateSession, deleteSession }
  : { session: ActorRefFrom<typeof sessionMachine>, updateSession: (s: Session) => any, deleteSession: (s: string) => any }) => {
  const [sessionState, sessionSend] = useActor(session);

  const _id = sessionState.context._id;
  const title = sessionState.context.title;
  const timers = sessionState.context.timersQueue;
  const priority = sessionState.context.priority;

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
        timers: timers.map((t) => mmssToMilliseconds(t.getSnapshot()?.context.millisecondsInput ?? '00:00')),
        priority,
      })}>
        Save session
      </button>
      <button onClick={() => deleteSession(_id)}>
        Delete session
      </button >
      <br />
      <br />
      <div>
        {timers.map((t, i) => (
          <Row key={i.toString()} style={{ width: '100%' }}>
            <Col span={22}>
              <TimerView timer={t} isCurrent={currentTimerIdx === i} />
            </Col>
            <Col span={2}>
              <Button
                style={{ width: '100%', height: '100%', border: '2px solid lightgrey' }}
                icon={<DeleteOutlined />}
                onClick={() => sessionSend({ type: 'REMOVE_TIMER', timerId: t.id })}
              />
            </Col>
          </Row>
        ))}
      </div>
    </>
  );
}

function App() {
  const sessionManagerService = useInterpret(SessionManagerMachine);
  const sessionCRUD = useSelector(sessionManagerService, ({ context }) => context.sessionCRUDMachine);
  const [sessionCRUDState, sessionCRUDSend] = useActor(sessionCRUD);
  const sessions = useSelector(sessionManagerService, ({ context }) => context.sessions);

  return (
    <Row style={{ padding: '40px', width: '100vw' }}>
      <Col span={24}>
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
        <Row gutter={[16, 16]}>
          {sessions
            .map((s, i) => (
              <Col key={i.toString()} span={8} xs={24} lg={12} xxl={8}>
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
              </Col>
            ))}
        </Row>
        <h2>Notes</h2>
        <ul>
          <li>Soft reset restarts the timer when is running and keeps going</li>
          <li>Hard reset restarts the timer when is paused and stops it, allowing new input</li>
        </ul>
        <p>Disclaimer: sound belongs to Microsoft</p>
      </Col>
    </Row >
  );
}

export default App;
