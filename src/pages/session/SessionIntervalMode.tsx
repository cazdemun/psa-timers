import React from 'react';
import { useActor } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { sessionMachine } from '../../timerMachine/sessionMachine';
import { TimerRecordCRUDMachine } from '../../timerMachine/sessionManagerMachine';
import {
  Button, Card, Col, Divider, List, Row, Space, Switch, Typography
} from 'antd';
import {
  FullscreenOutlined
} from '@ant-design/icons';
import { formatMillisecondsHHmmss, formatMillisecondsSSS } from '../../utils';
import TimerViewIntervalMode from '../timer/TimerIntervalMode';

import './SessionIntervalMode.css'
import { isToday } from 'date-fns';

type SessionViewIntervalDisplayProps = {
  millisecondsLeft: number
}

const SessionViewIntervalDisplay: React.FC<SessionViewIntervalDisplayProps> = (props) => {
  return (
    <Card type='inner' style={{ borderRadius: 12, border: '1px solid darkgrey' }}>
      <Row justify='center'>
        <Col style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
          <Typography.Title style={{ margin: 0, fontSize: '60px', lineHeight: '60px', }}>
            {formatMillisecondsHHmmss(props.millisecondsLeft)}
          </Typography.Title>
          <Typography.Title style={{ margin: 0, fontSize: '18px', lineHeight: '18px', paddingRight: '4px' }}>
            {formatMillisecondsSSS(props.millisecondsLeft)}
          </Typography.Title>
        </Col>
      </Row>
    </Card>
  );
};

type SessionViewIntervalControlsProps = {
  onPlay: (...args: any[]) => any
  onPause: (...args: any[]) => any
  onReset: (...args: any[]) => any
}

const SessionViewIntervalControls: React.FC<SessionViewIntervalControlsProps> = (props) => {
  return (
    <Row style={{ height: '80px' }}>
      <Button style={{ flex: '1', height: '100%', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, }}>Start</Button>
      <Button style={{ flex: '1', height: '100%', borderTopRightRadius: 12, borderBottomRightRadius: 12, }}>Clear</Button>
    </Row>
  );
};

type SessionViewIntervalModeProps = {
  recordMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>,
  sessionMachine: ActorRefFrom<typeof sessionMachine>,
}
const SessionViewIntervalMode: React.FC<SessionViewIntervalModeProps> = ({ recordMachine, sessionMachine }) => {

  const [sessionState, sessionSend] = useActor(sessionMachine);

  const _id = sessionState.context._id;
  const title = sessionState.context.title;
  const timers = sessionState.context.timersQueue;
  const currentTimerIdx = sessionState.context.currentTimerIdx;
  const totalGoal = sessionState.context.totalGoal;

  // what happens with zero or not found
  const [currentTimerState] = useActor(timers[currentTimerIdx]);
  const millisecondsLeft = currentTimerState.context.millisecondsLeft;

  const [timerRecordCRUDState] = useActor(recordMachine);

  const filteredRecords = timerRecordCRUDState.context.docs
    .filter((r) => r.sessionId === _id)
    .filter((r) => isToday(r.finalTime))
    .sort((a, b) => b.finalTime - a.finalTime);
  const totalTime = filteredRecords.reduce((acc, x) => acc + x.millisecondsOriginalGoal, 0);

  return (
    <Col span={8} xs={24} lg={12} xxl={8}>
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
              <Row>
                <Button icon={<FullscreenOutlined />} onClick={() => sessionSend({ type: 'TO_FREE_MODE' })} />
              </Row>
            </Col>
          </Row>
        )}
      >
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <SessionViewIntervalDisplay millisecondsLeft={millisecondsLeft} />
          </Col>
          <Col span={24}>
            <SessionViewIntervalControls
              onPlay={() => { }}
              onPause={() => { }}
              onReset={() => { }}
            />
          </Col>
          <Col span={24}>
            <Card
              title="Intervals/Timers"
              type='inner'
              headStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottom: '1px solid darkgrey' }}
              style={{ borderRadius: 12, border: '1px solid darkgrey' }}
              bodyStyle={{ padding: '1px 0px 0px 0px' }}
            >
              <List
                dataSource={timers}
                renderItem={(t, i) => (
                  <List.Item className={currentTimerIdx === i ? 'selected-interval' : undefined}>
                    <TimerViewIntervalMode timerMachine={t} isCurrent={currentTimerIdx === i} />
                  </List.Item>
                )}
              />
              <Row
                style={{
                  borderTop: '1px solid darkgrey',
                  padding: '8px 16px'
                }}
                align='middle'
              >
                <Typography.Text>
                  {`Total: ${formatMillisecondsHHmmss(totalGoal)}`}
                </Typography.Text>
                <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
                <Typography.Text>
                  {`Today: ${formatMillisecondsHHmmss(totalTime)}`}
                </Typography.Text>
                <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
                <Space style={{ flex: 1, justifyContent: 'end' }}>
                  <Typography.Text>
                    Restart when done:
                  </Typography.Text>
                  <Switch />
                </Space>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    </Col>
  );
};

export default SessionViewIntervalMode;
