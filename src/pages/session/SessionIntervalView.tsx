import React, { useContext } from 'react';
import { useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import {
  Button, Card, Col,
  Row, Select, Space, Typography
} from 'antd';
import {
  DeleteOutlined, DownOutlined,
  LineChartOutlined, UpOutlined,
} from '@ant-design/icons';
import { formatMillisecondsHHmmss, formatMillisecondsSSS, sortByIndex } from '../../utils';
import { alarmNames } from '../../services/alarmService';
import { SessionMachine } from '../../machines/v2/newSessionMachine';
import GlobalServicesContext from '../../context/GlobalServicesContext';
import { SessionCRUDStateMachine, TimerCRUDStateMachine } from '../../machines/v2/appService';
import { Session } from '../../models';
import SessionContent from './SessionContent';
import TimerModal from '../timer/TimerModal';
import { TimerMachine } from '../../machines/v2/newTimerMachine';

import './SessionIntervalMode.css'
import SessionVideoDisplay from './SessionVideoDisplay';

const swapItem = (
  direction: 'up' | 'down',
  sessionToSwap: Session,
  sessions: Session[],
  SessionCRUDService: ActorRefFrom<SessionCRUDStateMachine>
) => {
  const siblingSessions = sessions
    .sort((a, b) => sortByIndex(a, b));

  const sessionToSwapIndex = siblingSessions.findIndex((siblingSession) => siblingSession._id === sessionToSwap._id)
  const sessionNeighbour = (
    sessionToSwapIndex === -1
    || (sessionToSwapIndex === 0 && direction === 'up')
    || (sessionToSwapIndex === siblingSessions.length - 1 && direction === 'down')
  )
    ? undefined
    : siblingSessions.at(direction === 'up' ? sessionToSwapIndex - 1 : sessionToSwapIndex + 1);

  if (!sessionNeighbour) return;

  SessionCRUDService.send({
    type: 'BATCH',
    data: [
      {
        type: 'UPDATE',
        _id: sessionToSwap._id,
        doc: {
          index: sessionNeighbour.index
        }
      },
      {
        type: 'UPDATE',
        _id: sessionNeighbour._id,
        doc: {
          index: sessionToSwap.index
        }
      },
    ],
  })
}


const deleteSessionWithConfirm = (
  session: Session,
  SessionCRUDService: ActorRefFrom<SessionCRUDStateMachine>,
  TimerCRUDService: ActorRefFrom<TimerCRUDStateMachine>,
) => {
  if (window.confirm('Do you really want to delete the session? It will also delete all its timers (and there is no coming back)')) {
    const deleteTimersEvents = session.timers
      .map((_id) => ({
        type: 'DELETE',
        _id,
      }) as const);

    SessionCRUDService.send({
      type: 'DELETE',
      _id: session._id,
    });

    TimerCRUDService.send({
      type: 'BATCH',
      data: deleteTimersEvents,
    });
  }
}

type SessionPureDisplayProps = {
  millisecondsLeft: number
}

const SessionPureDisplay: React.FC<SessionPureDisplayProps> = (props) => {
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

type SessionDisplayProps = {
  timerMachine: ActorRefFrom<TimerMachine>,
}

const SessionDisplay: React.FC<SessionDisplayProps> = (props) => {
  const timeLeft = useSelector(props.timerMachine, ({ context }) => context.timeLeft);

  return (
    <SessionPureDisplay millisecondsLeft={timeLeft} />
  );
};

type SessionControlsWithActorProps = {
  currentTimerMachine: ActorRefFrom<TimerMachine>
  onPlay: (...args: any[]) => any
  onReset: (...args: any[]) => any
}

const SessionControlsWithActor: React.FC<SessionControlsWithActorProps> = (props) => {
  const idle = useSelector(props.currentTimerMachine, (state) => state.matches('clock.idle'))
  const paused = useSelector(props.currentTimerMachine, (state) => state.matches('clock.paused'))
  return (
    <Row style={{ height: '80px' }}>
      <Button
        style={{ flex: '1', height: '100%', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, }}
        onClick={() => idle || paused ? props.onPlay() : props.currentTimerMachine.send('PAUSE')}
      >
        {idle || paused ? 'Start' : 'Pause'}
      </Button>
      <Button
        style={{ flex: '1', height: '100%', borderTopRightRadius: 12, borderBottomRightRadius: 12, }}
        onClick={props.onReset}
      >
        Clear
      </Button>
    </Row>
  );
};

type SessionControlsProps = {
  currentTimerMachine: ActorRefFrom<TimerMachine> | undefined
  onPlay: (...args: any[]) => any
  onPause: (...args: any[]) => any
  onReset: (...args: any[]) => any
}

const SessionControls: React.FC<SessionControlsProps> = (props) => {
  return props.currentTimerMachine
    ? (
      <SessionControlsWithActor
        currentTimerMachine={props.currentTimerMachine}
        onPlay={props.onPlay}
        onReset={props.onReset}
      />
    )
    : (
      <Row style={{ height: '80px' }}>
        <Button
          style={{ flex: '1', height: '100%', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, }}
          onClick={props.onPlay}
        >
          Start
        </Button>
        <Button
          style={{ flex: '1', height: '100%', borderTopRightRadius: 12, borderBottomRightRadius: 12, }}
          onClick={props.onReset}
        >
          Clear
        </Button>
      </Row>
    );
};

type SessionIntervalViewProps = {
  sessionActor: ActorRefFrom<SessionMachine>,
}

const SessionIntervalView: React.FC<SessionIntervalViewProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);
  const sessions = useSelector(SessionCRUDService, ({ context }) => context.docs);

  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);

  const timers = useSelector(service, ({ context }) => context.timers);

  const timerModal = useSelector(props.sessionActor, (state) => state.matches('interval.timerModal'));

  const sessionDoc = useSelector(props.sessionActor, ({ context }) => context.session);
  const selectedTimerDoc = useSelector(props.sessionActor, ({ context }) => context.selectedTimer);
  const currentTimerId = useSelector(props.sessionActor, ({ context }) => context.currentTimerId);

  const currentTimerMachine = timers.find((actor) => actor.id === currentTimerId);

  return (
    <>
      <TimerModal
        open={timerModal}
        onCancel={() => props.sessionActor.send({ type: 'CLOSE_TIMER_MODAL' })}
        timer={selectedTimerDoc}
      />
      <Col span={8} xs={24} lg={12} xxl={8}>
        <Card
          className='session-card'
          headStyle={{ padding: '8px' }}
          bodyStyle={{ padding: '8px' }}
          title={(
            <Typography.Title
              editable={{
                onChange: (title) => SessionCRUDService.send({
                  type: 'UPDATE',
                  _id: sessionDoc._id,
                  doc: { title }
                })
              }}
              level={3}
            >
              {sessionDoc.title}
            </Typography.Title >
          )}
          extra={(
            <Space direction='vertical'>
              <Select
                style={{ width: '152px' }}
                onChange={(sound) => SessionCRUDService.send({
                  type: 'UPDATE',
                  _id: sessionDoc._id,
                  doc: { sound }
                })}
                defaultValue={sessionDoc.sound}
                options={alarmNames.map((a) => ({ label: a, value: a }))}
              />
              <Space>
                <Button icon={<LineChartOutlined />} onClick={() => { }} disabled />
                <Button icon={<UpOutlined />} onClick={() => swapItem('up', sessionDoc, sessions, SessionCRUDService)} />
                <Button icon={<DownOutlined />} onClick={() => swapItem('down', sessionDoc, sessions, SessionCRUDService)} />
                <Button icon={<DeleteOutlined />} onClick={() => deleteSessionWithConfirm(sessionDoc, SessionCRUDService, TimerCRUDService)} />
              </Space>
            </Space>
          )}
        >
          <Row gutter={[8, 8]}>
            <Col span={24}>
              {currentTimerMachine && <SessionVideoDisplay timerActor={currentTimerMachine} sessionTitle={sessionDoc.title} />}
              {currentTimerMachine && <SessionDisplay timerMachine={currentTimerMachine} />}
              {!currentTimerMachine && <SessionPureDisplay millisecondsLeft={0} />}
            </Col>
            <Col span={24}>
              <SessionControls
                currentTimerMachine={currentTimerMachine}
                onPlay={() => props.sessionActor.send({ type: 'START_TIMER' })}
                onPause={() => { }}
                onReset={() => props.sessionActor.send({ type: 'CLEAR' })}
              />
            </Col>
            <Col span={24}>
              <SessionContent
                session={sessionDoc}
                sessionActor={props.sessionActor}
              />
            </Col>
          </Row>
        </Card>
      </Col >
    </>
  );
};

export default SessionIntervalView;
