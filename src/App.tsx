import { useState } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import { AppMachine, SessionCRUDMachine, TimerCRUDMachine, TimerRecordCRUDMachine } from './timerMachine/appMachine';
import { formatMillisecondsHHmmss, formatMillisecondsmmss, isEmpty, mmssToMilliseconds } from './utils';
import {
  Button, Card, Checkbox, Col, Divider, Layout,
  List, Row, Select, Space, Statistic, Typography
} from 'antd';
import {
  DeleteOutlined, LikeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { format, isToday } from 'date-fns';
import SessionView from './pages/SessionView';

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

const index = [
  "1. Introduction 00:00",
  "2. Presentation 00:47",
  "3. Grid 01:49",
  "4. Setup 02:06",
  "5. Image loading 03:43",
  "6. Premultyplying images 05:45",
  "7. Training 12:27",
  "8. Gradients 14:16",
  "9. Default behavior 15:18",
  "10. Loss spikes 17:07",
  "11. Gradient normalization 18:22",
  "12. Stochastic updates 19:17",
  "13. Batch size 22:07",
  "14. Results 22:39",
  "15. Experiments 23:19",
  "16. Optimization 26:51",
  "17. Growth 29:21",
  "18. Loss 30:21",
  "19. Variant 32:29",
  "20. Conclusion 33:17",
]

type YoutubeCalculatorFormat = {
  originalString: string
  startTimeStampMilliseconds: number,
  durationMilliseconds: number
}

const YoutubeCalculator = () => {
  return (
    <>
      {
        index
          //   .map((s) => s.match(/[0-5]\d:[0-5]\d/) as unknown as string[])
          //   .map((s) => s[0])
          .reduce((acc: YoutubeCalculatorFormat[], s: string, idx: number, arr: string[]) => {
            if (arr.length === idx + 1) {
              const [regexmmss] = s.match(/[0-5]\d:[0-5]\d/) as string[]
              return acc.concat([{
                originalString: s,
                startTimeStampMilliseconds: mmssToMilliseconds(regexmmss),
                durationMilliseconds: 0,
              }]);
            }
            const [nextregexmmss] = arr[idx + 1].match(/[0-5]\d:[0-5]\d/) as string[]
            const nextMilliseconds = mmssToMilliseconds(nextregexmmss);
            const [regexmmss] = s.match(/[0-5]\d:[0-5]\d/) as string[]
            const currentMilliseconds = mmssToMilliseconds(regexmmss);
            const difference = nextMilliseconds - currentMilliseconds;
            return acc.concat([{
              originalString: s,
              startTimeStampMilliseconds: mmssToMilliseconds(regexmmss),
              durationMilliseconds: difference,
            }]);
          }, [])
          .map((s) => <div>{`${s.originalString} (${formatMillisecondsmmss(s.durationMilliseconds)})`}</div>)
      }
    </>
  );
}

type LoadedAppProps = {
  timerCRUDMachine: ActorRefFrom<typeof TimerCRUDMachine>
  sessionCRUDMachine: ActorRefFrom<typeof SessionCRUDMachine>,
  timerRecordCRUDMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>
  sessions: ActorRefFrom<typeof sessionMachine>[]
}


const LoadedApp: React.FC<LoadedAppProps> = (props) => {
  const [timerCRUDState] = useActor(props.timerCRUDMachine);
  const [sessionCRUDState, sessionCRUDSend] = useActor(props.sessionCRUDMachine);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Layout.Header>
        <Row style={{ height: '100%' }} align='middle'>
          <Typography.Title level={3} style={{ margin: 0, color: 'white' }}>
            PSA Timers
          </Typography.Title>
        </Row>
      </Layout.Header>
      {/* <YoutubeCalculator /> */}
      <List
        dataSource={timerCRUDState.context.docs}
        renderItem={(timer) => (
          <List.Item>
            {JSON.stringify(timer)}
          </List.Item>
        )}
      />
      <Layout.Content style={{ padding: '0px 40px' }}>
        <Divider />
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
            {props.sessions
              .map((s, i) => (
                <SessionView
                  key={i.toString()}
                  sessionMachine={s}
                  timerCRUDMachine={props.timerCRUDMachine}
                  recordCRUDMachine={props.timerRecordCRUDMachine}
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
          </Row>
        </Col>
        <Divider />
        <Typography.Title level={2} style={{ marginTop: 12 }}>
          Records
        </Typography.Title>
        <Divider />
        <Col span={12}>
          <Records recordMachine={props.timerRecordCRUDMachine} sessionMap={sessionCRUDState.context.docsMap} />
        </Col>
        <Divider />
        <Col span={24}>
          <h2>Notes</h2>
          <ul>
            <li>Soft reset restarts the timer when is running and keeps going</li>
            <li>Hard reset restarts the timer when is paused and stops it, allowing new input</li>
          </ul>
          <p>Disclaimer: sound belongs to Microsoft</p>
        </Col>
      </Layout.Content>
    </Layout >
  )
}

function App() {
  const sessionManagerService = useInterpret(AppMachine);

  const sessionCRUDMachine = useSelector(sessionManagerService, ({ context }) => context.sessionCRUDMachine);
  const timerRecordCRUDMachine = useSelector(sessionManagerService, ({ context }) => context.timerRecordCRUDMachine);
  const timerCRUDMachine = useSelector(sessionManagerService, ({ context }) => context.timerCRUDMachine);

  const sessions = useSelector(sessionManagerService, ({ context }) => context.sessions);

  return (!isEmpty(sessionCRUDMachine) && !isEmpty(timerRecordCRUDMachine) && !isEmpty(timerCRUDMachine))
    ? (
      <LoadedApp
        sessionCRUDMachine={sessionCRUDMachine}
        timerRecordCRUDMachine={timerRecordCRUDMachine}
        timerCRUDMachine={timerCRUDMachine}
        sessions={sessions}
      />
    ) : <>Loading</>;
}

export default App;
