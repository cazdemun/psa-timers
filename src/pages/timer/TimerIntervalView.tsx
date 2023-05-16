import React, { useContext } from 'react';
import { useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Button, Col, Divider, Popover, Row, Select, Space, Typography } from 'antd';
import {
  DeleteOutlined, DownOutlined, EditOutlined, MoreOutlined,
  PauseOutlined, PlayCircleFilled, PlayCircleOutlined,
  ReloadOutlined, UpOutlined,
} from '@ant-design/icons';

import { Session, Timer } from '../../models';
import { TimerMachine } from '../../machines/v2/newTimerMachine';
import { SessionCRUDStateMachine, TimerCRUDStateMachine } from '../../machines/v2/appService';
import { formatMillisecondsHHmmss, formatMillisecondsHHmmssSSS } from '../../utils';
import { alarmNames } from '../../services/alarmService';
import GlobalServicesContext from '../../context/GlobalServicesContext';

import './TimerIntervalView.css'

const SHOW_DEBUG_CONTROLS = false;

function swapElements<T>(array: Array<T>, source: number, dest: number) {
  return source === dest
    ? array
    : array.map((item, index) =>
      index === source
        ? array[dest]
        : index === dest
          ? array[source]
          : item
    );
}

const swapActionInCategory = (
  direction: 'up' | 'down',
  timerToSwap: Timer,
  session: Session,
  SessionCRUDService: ActorRefFrom<SessionCRUDStateMachine>
) => {

  const timerToSwapIndex = session.timers.findIndex((_id) => _id === timerToSwap._id);
  const destDelta = direction === 'up' ? -1 : 1;
  const dest = timerToSwapIndex + destDelta;

  if (timerToSwapIndex === -1) return;
  if (dest < 0 || dest > session.timers.length - 1) return;

  const newActions = swapElements(session.timers, timerToSwapIndex, dest);

  SessionCRUDService.send({
    type: 'UPDATE',
    _id: session._id,
    doc: {
      timers: newActions,
    }
  })
}

const deleteTimer = (
  timer: Timer,
  sessionsMap: Map<string, Session>,
  TimerCRUDService: ActorRefFrom<TimerCRUDStateMachine>,
  SessionCRUDService: ActorRefFrom<SessionCRUDStateMachine>,
) => {
  if (window.confirm('Do you really want to delete this item? There is no coming back')) {
    const session = sessionsMap.get(timer.sessionId);

    if (session) {
      SessionCRUDService.send({
        type: 'UPDATE',
        _id: session._id,
        doc: {
          timers: session.timers.filter((_id) => _id !== timer._id)
        }
      })
    }

    TimerCRUDService.send({
      type: 'DELETE',
      _id: timer._id,
    })
  }
}

type TimerIntervalViewProps = {
  timerActor: ActorRefFrom<TimerMachine>,
  session: Session,
  isCurrent?: boolean
  openTimerModal: (timer: Timer) => void
}

const TimerIntervalView: React.FC<TimerIntervalViewProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);
  const sessionsMap = useSelector(SessionCRUDService, ({ context }) => context.docsMap);

  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);

  const timerDoc = useSelector(props.timerActor, ({ context }) => context.timer)
  const timeLeft = useSelector(props.timerActor, ({ context }) => context.timeLeft)

  const paused = useSelector(props.timerActor, (state) => state.matches('clock.paused'))
  const idle = useSelector(props.timerActor, (state) => state.matches('clock.idle'))
  const running = useSelector(props.timerActor, (state) => state.matches('clock.running'))

  const duration = useSelector(props.timerActor, ({ context }) => context.duration)

  return (
    <Row style={{ width: '100%', paddingLeft: '16px', paddingRight: '16px' }} align='middle' gutter={[0, 8]}>
      <Col span={12} xs={24} sm={12} md={12}>
        <Row style={{ width: '100%' }} align='middle'>
          <Typography.Text
            style={{ flex: 2 }}
            editable={{
              onChange: (e) => TimerCRUDService.send({
                type: 'UPDATE',
                _id: timerDoc._id,
                doc: {
                  label: e
                }
              })
            }}
          >
            {timerDoc.label}
          </Typography.Text>
          <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
          <Select
            style={{ flex: 1 }}
            onChange={(e) => TimerCRUDService.send({
              type: 'UPDATE',
              _id: timerDoc._id,
              doc: {
                sound: e
              }
            })}
            value={timerDoc.sound}
            options={alarmNames.map((a) => ({ label: a, value: a }))}
          />
          <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
        </Row>
      </Col>
      {SHOW_DEBUG_CONTROLS && (
        <>
          <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
          <Typography.Text>
            {formatMillisecondsHHmmssSSS(timeLeft)}
          </Typography.Text>
          <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
          {idle && <Button icon={<PlayCircleOutlined />} onClick={() => props.timerActor.send({ type: 'START' })} />}
          {running && <Button icon={<PauseOutlined />} onClick={() => props.timerActor.send({ type: 'PAUSE' })} />}
          {paused && <Button icon={<PlayCircleFilled />} onClick={() => props.timerActor.send({ type: 'RESUME' })} />}
          <Button icon={<ReloadOutlined />} onClick={() => props.timerActor.send({ type: 'RESET' })} />
        </>
      )}
      <Col span={12} xs={24} sm={12} md={12}>
        <Row style={{ width: '100%' }} align='middle' justify='end'>
          <Typography.Text>
            {formatMillisecondsHHmmss(duration)}
          </Typography.Text>
          <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
          <Space direction='horizontal'>
            <Button icon={<EditOutlined />} onClick={() => props.openTimerModal(timerDoc)} />
            <Popover
              placement="rightTop"
              title='More actions'
              trigger="hover"
              content={(
                <Space direction='horizontal'>
                  <Button icon={<UpOutlined />} onClick={() => swapActionInCategory('up', timerDoc, props.session, SessionCRUDService)} />
                  <Button icon={<DownOutlined />} onClick={() => swapActionInCategory('down', timerDoc, props.session, SessionCRUDService)} />
                  <Button icon={<ReloadOutlined />} disabled={!idle} onClick={() => props.timerActor.send({ type: 'RESET_GROWTH' })} />
                  <Button icon={<DeleteOutlined />} onClick={() => deleteTimer(timerDoc, sessionsMap, TimerCRUDService, SessionCRUDService)} />
                </Space>
              )}
            >
              <Button icon={<MoreOutlined />} />
            </Popover>
          </Space>
        </Row>
      </Col>
    </Row>
  );
}

export default TimerIntervalView;