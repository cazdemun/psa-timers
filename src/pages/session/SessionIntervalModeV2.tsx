import React, { useContext } from 'react';
import { useActor, useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { Session, sessionMachine } from '../../machines/sessionMachine';
import { TimerCRUDMachine, TimerRecordCRUDMachine } from '../../machines/appMachine';
import {
  Button, Card, Col, Divider, Form, Input, InputNumber, List, Modal, Row, Select, Space, Switch, Typography
} from 'antd';
import {
  FullscreenOutlined, PlusOutlined,
} from '@ant-design/icons';
import { formatMillisecondsHHmmss, formatMillisecondsmmss, formatMillisecondsSSS, getLastIndexFirstLevel, getNextIndex, mmssToMilliseconds, validateInput } from '../../utils';
import TimerViewIntervalMode from '../timer/TimerIntervalMode';

import './SessionIntervalMode.css'
import { isToday } from 'date-fns';
import { Timer, timerMachine } from '../../machines/timerMachine';
import { alarmNames } from '../../services/alarmService';
import { SessionMachine } from '../../machines/v2/newSessionMachine';
import GlobalServicesContext from '../../context/GlobalServicesContext';

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


type TimerModalProps = {
  timerMachine: ActorRefFrom<typeof timerMachine>,
  open: boolean
  onCancel: (...args: any[]) => any
  onUpdate: (_id: string, doc: Partial<Timer>) => any
}

const TimerModal: React.FC<TimerModalProps> = (props) => {
  const [form] = Form.useForm();
  const [currentTimerState] = useActor(props.timerMachine);
  const _id = currentTimerState.context._id;
  const millisecondsOriginalGoal = currentTimerState.context.millisecondsOriginalGoal;
  const countable = currentTimerState.context.countable;
  const priority = currentTimerState.context.priority;
  return (
    <Modal
      title="Update Timer"
      open={props.open}
      onCancel={props.onCancel}
      footer={null}
    >
      <Form
        form={form}
        initialValues={{
          goal: formatMillisecondsmmss(millisecondsOriginalGoal),
          countable,
          priority,
        }}
        onFinish={(values) => {
          console.log(values.goal);
          props.onUpdate(_id, {
            millisecondsOriginalGoal: mmssToMilliseconds(values.goal),
            countable: values.countable,
            priority: values.priority,
          })
          props.onCancel();
        }}
      >
        <Form.Item
          name="goal"
          rules={[{
            validator: (_, value) => (validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss')))
          }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="priority"
          rules={[{
            validator: (_, value) => (value >= 0 ? Promise.resolve() : Promise.reject(new Error('Only positive numbers')))
          }]}
        >
          <InputNumber step={1} />
        </Form.Item>
        <Form.Item label="countable" name="countable" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type='primary' htmlType='submit'>Update</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

type SessionViewIntervalModeProps = {
  sessionActor: ActorRefFrom<SessionMachine>,
}
const SessionViewIntervalMode: React.FC<SessionViewIntervalModeProps> = ({ sessionActor }) => {

  const { service } = useContext(GlobalServicesContext);

  const sessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);

  const timerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  const timersDocs = useSelector(timerCRUDService, ({ context }) => context.docs);

  const timerRecordCRUDService = useSelector(service, ({ context }) => context.timerRecordCRUDMachine);
  const recordsDoc = useSelector(timerRecordCRUDService, ({ context }) => context.docs);

  // const [sessionState, sessionSend] = useActor(sessionActor);
  const context = useSelector(sessionActor, ({ context }) => context);

  const timerModal = useSelector(sessionActor, (state) => state.matches('interval.timerModal'));

  const sessionDoc = useSelector(sessionActor, ({ context }) => context.session);

  const _id = context._id;
  const title = context.title;
  const timers = context.timersQueue;
  const loop = context.loop;
  const sound = context.sound;
  const currentTimerIdx = context.currentTimerIdx;
  const selectedTimerId = context.selectedTimerId;
  const totalGoal = context.totalGoal;
  const currentTimerMachine = timers.at(currentTimerIdx);
  const selectedTimerMachine = timers.find((timer) => timer.id === selectedTimerId);

  // const [, timerCRUDSend] = useActor(timerCRUDMachine);

  const filteredRecords = recordsDoc
    .filter((r) => r.sessionId === _id)
    .filter((r) => isToday(r.finalTime))
    .sort((a, b) => b.finalTime - a.finalTime);

  const totalTime = filteredRecords.reduce((acc, x) => acc + x.originalTime, 0);

  const timerLastIndex = getLastIndexFirstLevel(timersDocs);

  return (
    <>
      {selectedTimerMachine && (<></>
        // <TimerModal
        //   timerMachine={selectedTimerMachine}
        //   open={timerModal && !!selectedTimerMachine}
        //   onCancel={() => sessionSend({ type: 'CLOSE_TIMER_MODAL' })}
        //   onUpdate={(_id: string, doc: Partial<Timer>) => timerCRUDSend({ type: 'UPDATE', _id, doc })}
        // />
      )}
      <Col span={8} xs={24} lg={12} xxl={8}>
        <Card
          headStyle={{ padding: '8px' }} bodyStyle={{ padding: '8px' }}
          title={(
            <Typography.Text editable={{
              onChange: (title) => sessionCRUDService.send({
                type: 'UPDATE',
                _id: _id,
                doc: { title }
              })
            }}>
              {sessionDoc.title}
            </Typography.Text >
          )}
          extra={(
            <Row gutter={[8, 8]}>
              <Select
                style={{ width: '200px' }}
                onChange={(sound) => sessionCRUDService.send({
                  type: 'UPDATE',
                  _id: _id,
                  doc: { sound }
                })}
                defaultValue={sound}
                options={alarmNames.map((a) => ({ label: a, value: a }))}
              />
              <Col>
                <Row>
                  <Button icon={<FullscreenOutlined />} onClick={() => sessionActor.send({ type: 'TO_FREE_MODE' })} />
                </Row>
              </Col>
            </Row>
          )}
        >
          <Row gutter={[8, 8]}>
            <Col span={24}>
              {/* {currentTimerMachine && <SessionViewDisplay timerMachine={currentTimerMachine} />} */}
              {!currentTimerMachine && <SessionViewIntervalDisplay millisecondsLeft={0} />}
            </Col>
            <Col span={24}>
              <SessionViewIntervalControls
                onPlay={() => sessionActor.send({ type: 'START_TIMER' })}
                onPause={() => { }}
                onReset={() => { }}
              />
            </Col>
            <Col span={24}>
              <Card
                title={(
                  <Button icon={<PlusOutlined />} onClick={() => timerCRUDService.send({
                    type: 'CREATE',
                    doc: {
                      created: Date.now(),
                      index: getNextIndex(timerLastIndex),
                      label: 'Newer alarm',
                      sessionId: _id,
                      sound: 'alarm',
                      originalTime: 5000,
                      saveRecord: false,
                    }
                  })}>
                    Add Interval
                  </Button>
                )}
                type='inner'
                headStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottom: '1px solid darkgrey' }}
                style={{ borderRadius: 12, border: '1px solid darkgrey' }}
                bodyStyle={{ padding: '1px 0px 0px 0px' }}
              >
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
              </Card>
            </Col>
          </Row>
        </Card>
      </Col >
    </>
  );
};

export default SessionViewIntervalMode;
