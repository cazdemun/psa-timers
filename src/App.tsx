import React, { useEffect, useState } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from './timerMachine/sessionMachine';
import { SessionManagerMachine, TimerRecordCRUDMachine } from './timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmss, formatMillisecondsHHmmssSSS, formatMillisecondsmmss, mmssToMilliseconds, trace } from './utils';
import TimerView from './pages/TimerView';
import {
  Button, Card, Checkbox, Col, Divider, Layout,
  List, Row, Select, Space, Statistic, Typography
} from 'antd';
import {
  DeleteOutlined, LikeOutlined, NodeCollapseOutlined, NodeExpandOutlined,
  PlusOutlined, ReloadOutlined, SaveOutlined, LineChartOutlined
} from '@ant-design/icons';
import { addDays, differenceInCalendarDays, format, fromUnixTime, isSameDay, isToday, parse } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimerRecord } from './timerMachine/timerMachine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const simpleRange = (n: number): number[] => [...Array(n).keys()];

export const getRangeDates = (
  since: Date = parse('01/01/2022', 'dd/MM/yyyy', new Date()), to: Date = new Date(),
): Date[] => (
  simpleRange(trace(differenceInCalendarDays(to, since)) + 1)
    .map((x) => addDays(since, x))
    .sort((a, b) => a.getTime() - b.getTime())
);

const TimersByDayChart = ({ timerRecords }: { timerRecords: TimerRecord[] }) => {
  const [data, setData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  });

  const options = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          precision: 0,
        },

      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Timers history',
      },
    },
  };

  useEffect(() => {
    const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
    if (firstRecording) {
      const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
      const dates = getRangeDates(firstDate, new Date());
      const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
      const dataset = dates
        .map((d) => timerRecords
          .map((x) => fromUnixTime(x.finalTime / 1000))
          .filter((x) => isSameDay(x, d))
          .length);

      setData({
        labels,
        datasets: [
          {
            label: 'Timers done that day',
            data: dataset,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      });
    }
  }, [timerRecords]);

  return (
    <Line options={options} data={data} />
  );
};

const TotalTimeByDayChart = ({ timerRecords }: { timerRecords: TimerRecord[] }) => {
  const [data, setData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  });

  const options = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          precision: 0,
          callback: function (value: any, index: any, ticks: any) {
            return formatMillisecondsHHmmss(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Timers history',
      },
    },
  };

  useEffect(() => {
    const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
    if (firstRecording) {
      const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
      const dates = getRangeDates(firstDate, new Date());
      const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
      const dataset = dates
        .map((d) => timerRecords
          .filter((x) => isSameDay(fromUnixTime(x.finalTime / 1000), d))
          .map((x) => x.millisecondsOriginalGoal)
          .reduce((acc, x) => acc + x, 0));

      setData({
        labels,
        datasets: [
          {
            label: 'Timers done that day',
            data: dataset,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      });
    }
  }, [timerRecords]);

  return (
    <Line options={options} data={data} />
  );
};

const AverageTimePerTimerByDayChart = ({ timerRecords }: { timerRecords: TimerRecord[] }) => {
  const [data, setData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  });

  const options = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          precision: 0,
          callback: function (value: any, index: any, ticks: any) {
            return formatMillisecondsHHmmss(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Timers history',
      },
    },
  };

  useEffect(() => {
    const [firstRecording] = timerRecords.slice(0).sort((a, b) => a.finalTime - b.finalTime);
    if (firstRecording) {
      const firstDate = fromUnixTime(firstRecording.finalTime / 1000);
      const dates = getRangeDates(firstDate, new Date());
      const labels = dates.map((x) => format(x, 'dd/MM/yyyy'));
      const dataset = dates
        .map((d) => {
          const totalDayTime = timerRecords
            .filter((x) => isSameDay(fromUnixTime(x.finalTime / 1000), d))
            .map((x) => x.millisecondsOriginalGoal)
            .reduce((acc, x) => acc + x, 0);

          const totalTimers = timerRecords
            .map((x) => fromUnixTime(x.finalTime / 1000))
            .filter((x) => isSameDay(x, d))
            .length;
          return totalTimers === 0 ? 0 : Math.floor(totalDayTime / totalTimers);
        });

      setData({
        labels,
        datasets: [
          {
            label: 'Timers done that day',
            data: dataset,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      });
    }
  }, [timerRecords]);

  return (
    <Line options={options} data={data} />
  );
};

const SessionView = ({ recordMachine, session, updateSession, deleteSession }
  : {
    recordMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>,
    session: ActorRefFrom<typeof sessionMachine>,
    updateSession: (s: Session) => any,
    deleteSession: (s: string) => any
  }) => {
  const [isChartModalVisible, setIsChartModalVisible] = useState<boolean>(false);

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
        <Row gutter={[8, 8]}>
          <Col>
            <Space>
              <Statistic style={{ flex: 'none' }} title="Today Timers" value={filteredRecords.length} prefix={<LikeOutlined />} />
              <Statistic style={{ flex: 'none' }} title="Today Time" value={formatMillisecondsHHmmss(totalTime)} />
            </Space>
          </Col>
          <Col>
            <Row>
              <Button icon={<PlusOutlined />} onClick={() => sessionSend({ type: 'ADD' })} />
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
              <Button icon={<LineChartOutlined />} onClick={() => setIsChartModalVisible((v) => !v)} />
            </Row>
            <Row>
              <Button icon={<ReloadOutlined />} onClick={() => sessionSend({ type: 'RESTART_SESSION' })} />
              <Button icon={<NodeCollapseOutlined />} onClick={() => sessionSend({ type: 'OPEN_TIMERS' })} />
              <Button icon={<NodeExpandOutlined />} onClick={() => sessionSend({ type: 'COLLAPSE_TIMERS' })} />
            </Row>
          </Col>
        </Row>
      )}
    >
      <Row style={{ margin: '4px 0px 8px 0px' }}>
        <Typography.Text>
          {`Id: ${_id} - Accumulated Time : ${formatMillisecondsHHmmssSSS(totalGoal)}`}
        </Typography.Text>
      </Row>
      <Row hidden={!isChartModalVisible}>
        <TimersByDayChart timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)} />
        <TotalTimeByDayChart timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)} />
        <AverageTimePerTimerByDayChart timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)} />
      </Row>
      <Row>
        {timers.map((t, i) => (
          <Row key={i.toString()} style={{ width: '100%' }}>
            <Col span={22}>
              <TimerView timer={t} isCurrent={currentTimerIdx === i} sessionTitle={title} />
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
    <Layout style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Layout.Header>
        <Row style={{ height: '100%' }} align='middle'>
          <Typography.Title level={3} style={{ margin: 0, color: 'white' }}>
            PSA Timers
          </Typography.Title>
        </Row>
      </Layout.Header>
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
        <Divider />
        <Typography.Title level={2} style={{ marginTop: 12 }}>
          Records
        </Typography.Title>
        <Divider />
        <Col span={12}>
          <Records recordMachine={timerRecordCRUD} sessionMap={sessionCRUDState.context.docsMap} />
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
  );
}

export default App;
