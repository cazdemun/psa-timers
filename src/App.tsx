import React from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import { SessionManagerMachine } from './timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmssSSS, mmssToMilliseconds } from './utils';
import TimerView from './pages/TimerView';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';

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
    <Card
      headStyle={{ padding: '8px' }} bodyStyle={{ padding: '8px' }}
      // title={`${title} - (${_id})`}
      title={(
        <Typography.Text
          editable={{
            onChange: (e) => sessionSend({
              type: 'CHANGE_TITLE',
              title: e,
            })
          }}
        >
          {title}
        </Typography.Text >
      )}
      extra={(
        <Space style={{ paddingLeft: '4px' }}>
          <Button icon={<PlusOutlined />} onClick={() => sessionSend({ type: 'ADD' })} />
          <Button icon={<ReloadOutlined />} onClick={() => sessionSend({ type: 'RESTART_SESSION' })} />
          <Button
            icon={<SaveOutlined />}
            onClick={() => updateSession({
              _id,
              title,
              timers: timers.map((t) => mmssToMilliseconds(t.getSnapshot()?.context.millisecondsInput ?? '00:00')),
              priority,
            })}
          />
          <Button icon={<DeleteOutlined />} onClick={() => deleteSession(_id)} />
        </Space>
      )}
    >
      <Row style={{ margin: '4px 0px 8px 0px' }}>
        <Typography.Text>
          {`Id: ${_id} - TotalSessionTime : ${formatMillisecondsHHmmssSSS(totalGoal)}`}
        </Typography.Text>
      </Row>
      <Row>
        {timers.map((t, i) => (
          <Row key={i.toString()} style={{ width: '100%' }}>
            <Col span={22}>
              <TimerView timer={t} isCurrent={currentTimerIdx === i} />
            </Col>
            <Col span={2}>
              <Button
                style={{
                  width: '100%',
                  height: '100%',
                  borderTop: '2px solid lightgrey',
                  borderBottom: '2px solid lightgrey',
                  borderRight: '2px solid lightgrey',
                }}
                icon={<DeleteOutlined />}
                onClick={() => sessionSend({ type: 'REMOVE_TIMER', timerId: t.id })}
              />
            </Col>
          </Row>
        ))}
      </Row>
    </Card >
  );
}

function App() {
  const sessionManagerService = useInterpret(SessionManagerMachine);
  const sessionCRUD = useSelector(sessionManagerService, ({ context }) => context.sessionCRUDMachine);
  const [, sessionCRUDSend] = useActor(sessionCRUD);
  const sessions = useSelector(sessionManagerService, ({ context }) => context.sessions);

  return (
    <Row style={{ padding: '0px 40px', width: '100vw' }}>
      <Space>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Sessions
        </Typography.Title>
        <Button
          icon={<PlusOutlined />}
          onClick={() => sessionCRUDSend({
            type: 'CREATE',
            doc: {
              timers: [10000],
              title: 'New Timer',
            },
          })}
        />
      </Space>
      <Col span={24}>
        <Row gutter={[8, 16]}>
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
