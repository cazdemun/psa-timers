import React, { useContext } from 'react';
import { useActor, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { TimerCRUDMachine, TimerRecordCRUDMachine } from '../../machines/appMachine';
import {
  Button, Card, Col, ConfigProvider, Divider, Form, Input, InputNumber, List, Modal, Row, Select, Space, Switch, Typography
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  FullscreenOutlined, LineChartOutlined, PlusOutlined, UpOutlined,
} from '@ant-design/icons';
import { formatMillisecondsHHmmss, formatMillisecondsmmss, formatMillisecondsSSS, getLastIndexFirstLevel, getNextIndex, mmssToMilliseconds, validateInput } from '../../utils';
import TimerViewIntervalMode from '../timer/TimerIntervalMode';
import { isToday } from 'date-fns';
import { Timer, timerMachine } from '../../machines/timerMachine';
import { alarmNames } from '../../services/alarmService';
import { SessionMachine } from '../../machines/v2/newSessionMachine';
import GlobalServicesContext from '../../context/GlobalServicesContext';
import { SessionCRUDStateMachine, TimerCRUDStateMachine } from '../../machines/v2/appService';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../../models';

import './SessionIntervalMode.css'
import TimerIntervalView from '../timer/TimerIntervalView';
import { TimerMachine } from '../../machines/v2/newTimerMachine';

const addTimer = (
  session: Session,
  timerLastIndex: number,
  TimerCRUDService: ActorRefFrom<TimerCRUDStateMachine>,
  SessionCRUDService: ActorRefFrom<SessionCRUDStateMachine>
) => {
  const newTimerId = uuidv4()

  TimerCRUDService.send({
    type: 'CREATE',
    doc: {
      _id: newTimerId,
      created: Date.now(),
      index: getNextIndex(timerLastIndex),
      label: 'Newer alarm',
      sessionId: session._id,
      sound: 'alarm',
      originalTime: 5000,
      saveRecord: false,
    }
  })

  SessionCRUDService.send({
    type: 'UPDATE',
    _id: session._id,
    doc: {
      timers: [...session.timers, newTimerId],
    }
  })
}

type SessionInternalViewContentFooterProps = {
  session: Session
  sessionActor: ActorRefFrom<SessionMachine>
}


const SessionInternalViewContentFooter: React.FC<SessionInternalViewContentFooterProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const timerRecordCRUDService = useSelector(service, ({ context }) => context.timerRecordCRUDMachine);
  const recordsDoc = useSelector(timerRecordCRUDService, ({ context }) => context.docs);

  const loop = useSelector(props.sessionActor, ({ context }) => context.loop);
  const totalGoal = useSelector(props.sessionActor, ({ context }) => context.totalGoal);

  const totalTime = recordsDoc
    .filter((r) => r.sessionId === props.session._id)
    .filter((r) => isToday(r.finished))
    .sort((a, b) => b.finished - a.finished)
    .reduce((acc, x) => acc + x.finalDuration, 0);

  return (
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
      <Typography.Text>
        {`Loop: ${loop}`}
      </Typography.Text>
      <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
      <Space style={{ flex: 1, justifyContent: 'end' }}>
        <Typography.Text>
          Restart when done:
        </Typography.Text>
        <Switch checked />
      </Space>
    </Row>
  );
};

type SessionIntervalViewContentProps = {
  session: Session
  sessionActor: ActorRefFrom<SessionMachine>
}

const SessionIntervalViewContent: React.FC<SessionIntervalViewContentProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);

  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  const timersDocs = useSelector(TimerCRUDService, ({ context }) => context.docs);
  const timerLastIndex = getLastIndexFirstLevel(timersDocs);

  const timers = useSelector(service, ({ context }) => context.timers);

  return (
    <Card
      title={(
        <Button
          icon={<PlusOutlined />}
          onClick={() => addTimer(props.session, timerLastIndex, TimerCRUDService, SessionCRUDService)}
        >
          Add Interval
        </Button>
      )}
      type='inner'
      headStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottom: '1px solid darkgrey' }}
      style={{ borderRadius: 12, border: '1px solid darkgrey' }}
      bodyStyle={{ padding: '1px 0px 0px 0px' }}
    >
      <ConfigProvider renderEmpty={() => <div hidden></div>}>
        <List
          dataSource={
            props.session.timers
              .map((_id) => timers.find((timerActor) => timerActor.id === _id))
              .filter((timerActor): timerActor is ActorRefFrom<TimerMachine> => timerActor !== undefined)
          }
          renderItem={(timerActor, index) => (
            <List.Item>
              <TimerIntervalView
                session={props.session}
                timerActor={timerActor}
              />
            </List.Item>
            // <List.Item className={currentTimerIdx === i ? 'selected-interval' : undefined}>
            //   <TimerViewIntervalMode
            //     timerMachine={t}
            //     isCurrent={currentTimerIdx === i}
            //     onUpdate={(doc) => timerCRUDSend({ type: 'UPDATE', _id: t.id, doc })}
            //     onEdit={(_id: string) => sessionSend({ type: 'OPEN_TIMER_MODAL', timerId: _id })}
            //     onDelete={(_id: string) => timerCRUDSend({ type: 'DELETE', _id })}
            //   />
            // </List.Item>
          )}
        />
      </ConfigProvider>
      {/* <List
      dataSource={timers}
      renderItem={(t, i) => (
        <List.Item className={currentTimerIdx === i ? 'selected-interval' : undefined}>
          <TimerViewIntervalMode
            timerMachine={t}
            isCurrent={currentTimerIdx === i}
            onUpdate={(doc) => timerCRUDSend({ type: 'UPDATE', _id: t.id, doc })}
            onEdit={(_id: string) => sessionSend({ type: 'OPEN_TIMER_MODAL', timerId: _id })}
            onDelete={(_id: string) => timerCRUDSend({ type: 'DELETE', _id })}
          />
        </List.Item>
      )}
    /> */}
      <SessionInternalViewContentFooter
        session={props.session}
        sessionActor={props.sessionActor}
      />
    </Card>
  );
};

export default SessionIntervalViewContent;
