import React from 'react';
import { useActor } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from '../timerMachine/sessionMachine';
import { TimerRecordCRUDMachine } from '../timerMachine/sessionManagerMachine';
import { formatMillisecondsHHmmss, formatMillisecondsHHmmssSSS, mmssToMilliseconds } from '../utils';
import TimerView from '../pages/TimerView';
import {
  Button, Card, Col, Modal, Row, Space, Statistic, Typography
} from 'antd';
import {
  DeleteOutlined, LikeOutlined, NodeCollapseOutlined, NodeExpandOutlined,
  PlusOutlined, ReloadOutlined, SaveOutlined, LineChartOutlined, AreaChartOutlined, 
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { isToday } from 'date-fns';
import { CustomHHmmssChartByDay, averageTimePerTimerByDayStrategy, TimersByDayChart, timeByDayStrategy } from '../components/Charts';
import SessionViewIntervalMode from './session/SessionIntervalMode';

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

  const freeMode = sessionState.matches('free');
  const intervalMode = sessionState.matches('interval');

  const modal = sessionState.matches('free.view.modal');
  const sideways = sessionState.matches('free.view.sideways');

  const totalGoal = sessionState.context.totalGoal;
  const currentTimerIdx = sessionState.context.currentTimerIdx;

  const [timerRecordCRUDState] = useActor(recordMachine);
  const filteredRecords = timerRecordCRUDState.context.docs
    .filter((r) => r.sessionId === _id)
    .filter((r) => isToday(r.finalTime))
    .sort((a, b) => b.finalTime - a.finalTime);
  const totalTime = filteredRecords.reduce((acc, x) => acc + x.millisecondsOriginalGoal, 0)

  return intervalMode ? (
    <SessionViewIntervalMode
      sessionMachine={session}
      recordMachine={recordMachine}
    />
  ) : (
    <Col span={sideways ? 16 : 8} xs={24} lg={sideways ? 16 : 12} xxl={sideways ? 16 : 8}>
      <Card
        headStyle={{ padding: '8px' }} bodyStyle={{ padding: '8px' }}
        title={(
          <Typography.Text editable={{ onChange: (e) => sessionSend({ type: 'CHANGE_TITLE', title: e, }) }}>
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
                    timersReal: [],
                    priority,
                  })}
                />
                <Button icon={<DeleteOutlined />} onClick={() => deleteSession(_id)} />
                <Button icon={<LineChartOutlined />} onClick={() => sessionSend({ type: 'TOGGLE_MODAL' })} />
              </Row>
              <Row>
                <Button icon={<ReloadOutlined />} onClick={() => sessionSend({ type: 'RESTART_SESSION' })} />
                <Button icon={<NodeCollapseOutlined />} onClick={() => sessionSend({ type: 'OPEN_TIMERS' })} />
                <Button icon={<NodeExpandOutlined />} onClick={() => sessionSend({ type: 'COLLAPSE_TIMERS' })} />
                <Button icon={<AreaChartOutlined />} onClick={() => sessionSend({ type: 'TOGGLE_SIDEWAYS' })} />
                <Button icon={<FullscreenExitOutlined />} onClick={() => sessionSend({ type: 'TO_INTERVAL_MODE' })} />
              </Row>
            </Col>
          </Row>
        )}
      >
        <Modal
          open={modal}
          onCancel={() => sessionSend({ type: 'TOGGLE_MODAL' })}
          footer={null}
        >
          <TimersByDayChart timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)} />
          <CustomHHmmssChartByDay
            timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)}
            rawDataStrategy={timeByDayStrategy}
            xAxisLabel="Total time per day"
            borderColor='rgb(102, 178, 255)'
            backgroundColor='rgba(102, 178, 255, 0.5)'
          />
          <CustomHHmmssChartByDay
            timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)}
            rawDataStrategy={averageTimePerTimerByDayStrategy}
            xAxisLabel="Average timer time per day"
            borderColor='rgb(153, 51, 255)'
            backgroundColor='rgba(153, 51, 255, 0.5)'
          />
        </Modal>
        <Row gutter={[16, 16]}>
          <Col span={sideways ? 12 : 0}>
            <TimersByDayChart timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)} />
            <CustomHHmmssChartByDay
              timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)}
              rawDataStrategy={timeByDayStrategy}
              xAxisLabel="Total time per day"
              borderColor='rgb(102, 178, 255)'
              backgroundColor='rgba(102, 178, 255, 0.5)'
            />
            <CustomHHmmssChartByDay
              timerRecords={timerRecordCRUDState.context.docs.filter((r) => r.sessionId === _id)}
              rawDataStrategy={averageTimePerTimerByDayStrategy}
              xAxisLabel="Average timer time per day"
              borderColor='rgb(153, 51, 255)'
              backgroundColor='rgba(153, 51, 255, 0.5)'
            />
          </Col>
          <Col span={sideways ? 12 : 24}>
            <Row style={{ margin: '4px 0px 8px 0px' }}>
              <Typography.Text>
                {`Id: ${_id} - Accumulated Time : ${formatMillisecondsHHmmssSSS(totalGoal)}`}
              </Typography.Text>
            </Row>
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
          </Col>
        </Row>
      </Card >
    </Col>
  );
};

export default SessionView;
