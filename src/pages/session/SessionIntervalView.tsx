import React, { useContext } from 'react';
import { useActor, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { TimerCRUDMachine, TimerRecordCRUDMachine } from '../../machines/appMachine';
import {
  Button, Card, Col, Divider, Form, Input, InputNumber,
  List, Modal, Row, Select, Space, Switch, Typography
} from 'antd';
import {
  DeleteOutlined, DownOutlined,
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
import SessionIntervalViewContent from './SessionIntervalViewContent';
import TimerModal from '../timer/TimerModal';

import './SessionIntervalMode.css'

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

type SessionViewDisplayProps = {
  timerMachine: ActorRefFrom<typeof timerMachine>,
}

const SessionViewDisplay: React.FC<SessionViewDisplayProps> = (props) => {
  const [currentTimerState] = useActor(props.timerMachine);
  const millisecondsLeft = currentTimerState.context.millisecondsLeft;

  return (
    <SessionViewIntervalDisplay millisecondsLeft={millisecondsLeft} />
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
      <Button
        style={{ flex: '1', height: '100%', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, }}
        onClick={props.onPlay}
      >
        Start
      </Button>
      <Button style={{ flex: '1', height: '100%', borderTopRightRadius: 12, borderBottomRightRadius: 12, }}>Clear</Button>
    </Row>
  );
};


// type TimerModalProps = {
//   timerMachine: ActorRefFrom<typeof timerMachine>,
//   open: boolean
//   onCancel: (...args: any[]) => any
//   onUpdate: (_id: string, doc: Partial<Timer>) => any
// }

// const TimerModal: React.FC<TimerModalProps> = (props) => {
//   const [form] = Form.useForm();
//   const [currentTimerState] = useActor(props.timerMachine);
//   const _id = currentTimerState.context._id;
//   const millisecondsOriginalGoal = currentTimerState.context.millisecondsOriginalGoal;
//   const countable = currentTimerState.context.countable;
//   const priority = currentTimerState.context.priority;
//   return (
//     <Modal
//       title="Update Timer"
//       open={props.open}
//       onCancel={props.onCancel}
//       footer={null}
//     >
//       <Form
//         form={form}
//         initialValues={{
//           goal: formatMillisecondsmmss(millisecondsOriginalGoal),
//           countable,
//           priority,
//         }}
//         onFinish={(values) => {
//           console.log(values.goal);
//           props.onUpdate(_id, {
//             millisecondsOriginalGoal: mmssToMilliseconds(values.goal),
//             countable: values.countable,
//             priority: values.priority,
//           })
//           props.onCancel();
//         }}
//       >
//         <Form.Item
//           name="goal"
//           rules={[{
//             validator: (_, value) => (validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss')))
//           }]}
//         >
//           <Input />
//         </Form.Item>
//         <Form.Item
//           name="priority"
//           rules={[{
//             validator: (_, value) => (value >= 0 ? Promise.resolve() : Promise.reject(new Error('Only positive numbers')))
//           }]}
//         >
//           <InputNumber step={1} />
//         </Form.Item>
//         <Form.Item label="countable" name="countable" valuePropName="checked">
//           <Switch />
//         </Form.Item>
//         <Form.Item>
//           <Button type='primary' htmlType='submit'>Update</Button>
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// }

type SessionIntervalViewProps = {
  sessionActor: ActorRefFrom<SessionMachine>,
}

const SessionIntervalView: React.FC<SessionIntervalViewProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);

  // const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  // const timersDocs = useSelector(TimerCRUDService, ({ context }) => context.docs);

  // const timerRecordCRUDService = useSelector(service, ({ context }) => context.timerRecordCRUDMachine);
  // const recordsDoc = useSelector(timerRecordCRUDService, ({ context }) => context.docs);

  // const timers = useSelector(service, ({ context }) => context.timers);

  // const [sessionState, sessionSend] = useActor(sessionActor);
  const timerModal = useSelector(props.sessionActor, (state) => state.matches('interval.timerModal'));
  const sessionDoc = useSelector(props.sessionActor, ({ context }) => context.session);
  const selectedTimerDoc = useSelector(props.sessionActor, ({ context }) => context.selectedTimer);

  // const context = useSelector(props.sessionActor, ({ context }) => context);
  // const loop = context.loop;
  // const _id = context._id;
  // const title = context.title;
  // const timers = context.timersQueue;
  // const sound = context.sound;
  // const currentTimerIdx = context.currentTimerIdx;
  // const totalGoal = context.totalGoal;
  // const currentTimerMachine = timers.at(currentTimerIdx);
  // const selectedTimerMachine = timers.find((timer) => tier.id === selectedTimerId);

  return (
    <>
      {(<></>
        // <TimerModal
        //   timerMachine={selectedTimerMachine}
        //   open={timerModal && !!selectedTimerMachine}
        //   onCancel={() => sessionSend({ type: 'CLOSE_TIMER_MODAL' })}
        //   onUpdate={(_id: string, doc: Partial<Timer>) => timerCRUDSend({ type: 'UPDATE', _id, doc })}
        // />
      )}
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
                {/* <Button icon={<FullscreenOutlined />} onClick={() => sessionActor.send({ type: 'TO_FREE_MODE' })} /> */}
                <Button icon={<LineChartOutlined />} onClick={() => { }} />
                <Button icon={<UpOutlined />} onClick={() => { }} />
                <Button icon={<DownOutlined />} onClick={() => { }} />
                <Button icon={<DeleteOutlined />} onClick={() => { }} />
              </Space>
            </Space>
          )}
        >
          <Row gutter={[8, 8]}>
            <Col span={24}>
              {/* {currentTimerMachine && <SessionViewDisplay timerMachine={currentTimerMachine} />} */}
              {/* {!currentTimerMachine && <SessionViewIntervalDisplay millisecondsLeft={0} />} */}
              <SessionViewIntervalDisplay millisecondsLeft={0} />
            </Col>
            <Col span={24}>
              <SessionViewIntervalControls
                onPlay={() => props.sessionActor.send({ type: 'START_TIMER' })}
                onPause={() => { }}
                onReset={() => { }}
              />
            </Col>
            <Col span={24}>
              <SessionIntervalViewContent
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
