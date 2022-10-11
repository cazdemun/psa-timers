import React, { useState } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import { SessionManagerMachine, TimerRecordCRUDMachine } from './timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmss, formatMillisecondsHHmmssSSS, formatMillisecondsmmss, mmssToMilliseconds } from './utils';
import TimerView from './pages/TimerView';
import { Button, Card, Checkbox, Col, Divider, List, Row, Select, Space, Statistic, Typography } from 'antd';
import { DeleteOutlined, LikeOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { format, isToday } from 'date-fns';

const SessionView = ({ recordMachine, session, updateSession, deleteSession }
  : {
    recordMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>,
    session: ActorRefFrom<typeof sessionMachine>,
    updateSession: (s: Session) => any,
    deleteSession: (s: string) => any
  }) => {
  const [sessionState, sessionSend] = useActor(session);

  const _id = sessionState.context._id;
  const title = sessionState.context.title;
  const timers = sessionState.context.timersQueue;
  const priority = sessionState.context.priority;

  const totalGoal = sessionState.context.totalGoal;
  const currentTimerIdx = sessionState.context.currentTimerIdx;

  const [timerRecordCRUDState] = useActor(recordMachine);
  const filteredRecords = timerRecordCRUDState.context.docs
    .filter((r) => r.sessionId === _id)
    .filter((r) => isToday(r.finalTime))
    .sort((a, b) => b.finalTime - a.finalTime);
  const totalTime = filteredRecords.reduce((acc, x) => acc + x.millisecondsOriginalGoal, 0)


  return (
    <Card
      headStyle={{ padding: '8px' }} bodyStyle={{ padding: '8px' }}
      title={(
        <Space>
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
        </Space>
      )}
      extra={(
        <Space style={{ paddingLeft: '4px' }}>
          <Statistic title="Today Sessions" value={filteredRecords.length} prefix={<LikeOutlined />} />
          <Statistic title="Today Time" value={formatMillisecondsHHmmss(totalTime)} />
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

const Records = ({ recordMachine, sessionMap }: { recordMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>, sessionMap: Map<string, Session> }) => {
  const [selectedSession, setSelectedSession] = useState<string | undefined>(undefined);
  const [onlyToday, setOnlyToday] = useState<boolean>(true);

  const [timerRecordCRUDState, timerRecordCRUDSend] = useActor(recordMachine);
  const filteredRecords = timerRecordCRUDState.context.docs
    .filter((r) => selectedSession ? r.sessionId === selectedSession : true)
    .filter((r) => onlyToday ? isToday(r.finalTime) : true)
    .sort((a, b) => b.finalTime - a.finalTime);
  const totalTime = filteredRecords.reduce((acc, x) => acc + x.millisecondsOriginalGoal, 0)

  return (
    <Card
      title={
        <Space>
          <Statistic title="Sessions" value={filteredRecords.length} prefix={<LikeOutlined />} />
          <Statistic title="Time" value={formatMillisecondsHHmmss(totalTime)} />
        </Space >
      }
      extra={(
        <Space>
          <Checkbox checked={onlyToday} onChange={(e) => setOnlyToday(e.target.checked)}>Only today</Checkbox>
          <Select
            style={{ width: '300px' }}
            allowClear
            onChange={(e) => setSelectedSession(e)}
            options={[...sessionMap.keys()].map((k) => ({
              value: k,
              label: sessionMap.get(k)?.title ?? '',
            }))}
          />
        </Space>
      )}
    >
      <List
        style={{ width: '100%' }}
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredRecords}
        renderItem={(i) => (
          <List.Item>
            <Row style={{ width: '100%' }}>
              <Col span={11}>
                <Typography.Paragraph>
                  {`Session: ${sessionMap.get(i.sessionId)?.title}`}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  {`Duration: ${formatMillisecondsmmss(i.millisecondsOriginalGoal)}`}
                </Typography.Paragraph>
              </Col>
              <Col span={11}>
                <Typography.Paragraph>
                  {`Stated on: ${format(i.finalTime - i.millisecondsOriginalGoal, 'HH:mm:ss aaaa')}`}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  {`Ended on: ${format(i.finalTime, 'HH:mm:ss aaaa')}`}
                </Typography.Paragraph>
              </Col>
              <Col span={2}>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => timerRecordCRUDSend({ type: 'DELETE', _id: i._id })}
                />
              </Col>
            </Row>
          </List.Item>
        )}
        pagination={{ pageSize: 10 }}
      />
    </Card >
  );
}

function App() {
  const sessionManagerService = useInterpret(SessionManagerMachine);
  const sessionCRUD = useSelector(sessionManagerService, ({ context }) => context.sessionCRUDMachine);
  const timerRecordCRUD = useSelector(sessionManagerService, ({ context }) => context.timerRecordCRUDMachine);
  const [sessionCRUDState, sessionCRUDSend] = useActor(sessionCRUD);
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
      <Divider />
      <Col span={24}>
        <Row gutter={[8, 16]}>
          {sessions
            .map((s, i) => (
              <Col key={i.toString()} span={8} xs={24} lg={12} xxl={8}>
                <SessionView
                  key={i.toString()}
                  recordMachine={timerRecordCRUD}
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
      </Col>
      <Typography.Title level={2} style={{ marginTop: 12 }}>
        Records
      </Typography.Title>
      <Divider />
      <Col span={12}>
        <Records recordMachine={timerRecordCRUD} sessionMap={sessionCRUDState.context.docsMap} />
      </Col>
      <Col span={24}>
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
