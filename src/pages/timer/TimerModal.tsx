import React, { useContext } from 'react';
import { Button, Form, Input, Modal, Row, } from "antd";
import { Timer } from '../../models';
import GlobalServicesContext from '../../context/GlobalServicesContext';
import { formatMillisecondsmmss, mmssToMilliseconds, validateInput } from '../../utils';
import { ActorRefFrom } from 'xstate';
import { useSelector } from '@xstate/react';
import { TimerCRUDStateMachine } from '../../machines/v2/appService';

type TimerFormValues = Pick<Timer, 'label'> & { duration: string }

const updateTimer = (
  values: TimerFormValues,
  timer: Timer,
  TimerCRUDService: ActorRefFrom<TimerCRUDStateMachine>
) => {
  const updatedTimer: Partial<Timer> = {
    duration: mmssToMilliseconds(values.duration)
  }

  TimerCRUDService.send({
    type: 'UPDATE',
    _id: timer._id,
    doc: {
      ...updatedTimer,
    }
  })
}

type DestroyableFormProps = {
  timer: Timer
  onFinish: (...args: any[]) => any
}

const DestroyableForm: React.FC<DestroyableFormProps> = (props) => {
  const [form] = Form.useForm<TimerFormValues>();

  const { service } = useContext(GlobalServicesContext);

  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  // const DoCategoryCRUDService = useSelector(service, ({ context }) => context.doCategoryCRUDActor);
  // const categories = useSelector(DoCategoryCRUDService, ({ context }) => context.docs);
  // const categoriesMap = useSelector(DoCategoryCRUDService, ({ context }) => context.docsMap);

  return (
    <Form
      form={form}
      initialValues={{ ...props.timer, duration: formatMillisecondsmmss(props.timer.duration) }}
      onFinish={(values) => {
        updateTimer(values, props.timer, TimerCRUDService);
        props.onFinish();
      }}
    >
      <pre>
        {JSON.stringify(props.timer)}
      </pre>
      <Form.Item
        label="Duration"
        name="duration"
        rules={[{
          validator: (_, value) => (validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss')))
        }]}
      >
        <Input />
      </Form.Item>
      <Row justify='end'>
        <Button
          type='primary'
          htmlType='submit'
        >
          Update
        </Button>
      </Row>
    </Form>
  );
};

type TimerModalProps = {
  open: boolean
  timer: Timer | undefined
  onCancel: (...args: any[]) => any
}

const TimerModal: React.FC<TimerModalProps> = (props) => {
  return (
    <Modal
      title='Edit timer'
      open={props.open}
      onCancel={props.onCancel}
      footer={null}
      destroyOnClose
    >
      {(props.timer) && (
        <DestroyableForm
          onFinish={props.onCancel}
          timer={props.timer}
        />
      )}
    </Modal >
  );
};

export default TimerModal;
