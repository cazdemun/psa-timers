import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import {
  Button, Card, ConfigProvider, Divider, List, Row, Space, Switch, Typography
} from 'antd';
import {
  PlusOutlined,
} from '@ant-design/icons';
import { formatMillisecondsHHmmss, getLastIndexFirstLevel, getNextIndex } from '../../utils';
import { isToday } from 'date-fns';
import { SessionMachine } from '../../machines/v2/newSessionMachine';
import GlobalServicesContext from '../../context/GlobalServicesContext';
import { SessionCRUDStateMachine, TimerCRUDStateMachine } from '../../machines/v2/appService';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../../models';
import TimerIntervalView from '../timer/TimerIntervalView';
import { TimerMachine } from '../../machines/v2/newTimerMachine';

import './SessionIntervalMode.css'

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
      duration: 5000,
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

type SessionContentFooterProps = {
  session: Session
  sessionActor: ActorRefFrom<SessionMachine>
}


const SessionContentFooter: React.FC<SessionContentFooterProps> = (props) => {
  const [totalGoal, setTotalGoal] = useState<number>(0);

  const { service } = useContext(GlobalServicesContext);

  const timers = useSelector(service, ({ context }) => context.timers);

  const timerRecordCRUDService = useSelector(service, ({ context }) => context.timerRecordCRUDMachine);
  const recordsDoc = useSelector(timerRecordCRUDService, ({ context }) => context.docs);

  const TimerRecordCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  const timersDocs = useSelector(TimerRecordCRUDService, ({ context }) => context.docs);

  const loop = useSelector(props.sessionActor, ({ context }) => context.loop);
  const restartWhenDone = useSelector(props.sessionActor, ({ context }) => context.restartWhenDone);

  useEffect(() => {
    const _totalGoal = props.session.timers
      .map((_id) => timers.find((actor) => actor.id === _id))
      .filter((actor): actor is ActorRefFrom<TimerMachine> => actor !== undefined)
      .map((actor) => actor.getSnapshot()?.context.duration)
      .reduce((acc, x) => (acc ?? 0) + (x ?? 0), 0) as number;
    setTotalGoal(_totalGoal);
  }, [timersDocs, props.session, timers]);

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
        <Switch checked={restartWhenDone} onClick={() => props.sessionActor.send({ type: 'TOGGLE_RESTART_WHEN_DONE' })} />
      </Space>
    </Row>
  );
};

type SessionContentProps = {
  session: Session
  sessionActor: ActorRefFrom<SessionMachine>
}

const SessionContent: React.FC<SessionContentProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);

  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  const timersDocs = useSelector(TimerCRUDService, ({ context }) => context.docs);
  const timerLastIndex = getLastIndexFirstLevel(timersDocs);

  const timers = useSelector(service, ({ context }) => context.timers);

  const currentTimerId = useSelector(props.sessionActor, ({ context }) => context.currentTimerId);

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
          renderItem={(timerActor) => (
            <List.Item className={currentTimerId === timerActor.id ? 'selected-interval' : undefined}>
              <TimerIntervalView
                session={props.session}
                timerActor={timerActor}
                openTimerModal={(timer) => props.sessionActor.send({ type: 'OPEN_TIMER_MODAL', timer })}
              />
            </List.Item>
          )}
        />
      </ConfigProvider>
      <SessionContentFooter
        session={props.session}
        sessionActor={props.sessionActor}
      />
    </Card>
  );
};

export default SessionContent;
