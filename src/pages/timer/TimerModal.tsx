import React, { useContext, useState } from 'react';
import { Button, Card, Checkbox, Form, Input, InputNumber, Modal, Row, } from "antd";
import { Timer } from '../../models';
import GlobalServicesContext from '../../context/GlobalServicesContext';
import { formatMillisecondsmmss, mmssToMilliseconds, validateInput } from '../../utils';
import { ActorRefFrom } from 'xstate';
import { useSelector } from '@xstate/react';
import { TimerCRUDStateMachine } from '../../machines/v2/appService';
import { useWatch } from 'antd/es/form/Form';

type TimerFormValues = Pick<Timer, 'label'> & { duration: string, growth?: { min?: string, max?: string, rate: number } }

const validateMin = (duration: string | undefined, min: string | undefined, max: string | undefined): boolean => {
  try {
    if (duration === undefined) return false;
    const _duration = mmssToMilliseconds(duration);
    if (min === undefined || min === '') return true;
    const _min = mmssToMilliseconds(min);
    if (_min > _duration) return false;
    if (max === undefined || max === '') return true;
    const _max = mmssToMilliseconds(max);
    return _min <= _max;
  } catch (error) {
    return false;
  }
};

const validateMax = (duration: string | undefined, max: string | undefined, min: string | undefined): boolean => {
  try {
    if (duration === undefined) return false;
    const _duration = mmssToMilliseconds(duration);
    if (max === undefined || max === '') return true;
    const _max = mmssToMilliseconds(max);
    if (_max < _duration) return false;
    if (min === undefined || min === '') return true;
    const _min = mmssToMilliseconds(max);
    return _min <= _max;
  } catch (error) {
    return false;
  }
};

const updateTimer = (
  values: TimerFormValues,
  timer: Timer,
  TimerCRUDService: ActorRefFrom<TimerCRUDStateMachine>
) => {
  const updatedTimer: Partial<Timer> = {
    label: values.label,
    duration: mmssToMilliseconds(values.duration),
    growth: values.growth
      ? {
        rate: values.growth.rate,
        min: values.growth.min === undefined || values.growth.min === '' ? undefined : mmssToMilliseconds(values.growth.min),
        max: values.growth.max === undefined || values.growth.max === '' ? undefined : mmssToMilliseconds(values.growth.max),
      }
      : undefined
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
  const [showGrowth, setShowGrowth] = useState<boolean>(props.timer.growth !== undefined);

  const [form] = Form.useForm<TimerFormValues>();

  const { service } = useContext(GlobalServicesContext);

  const duration = useWatch("duration", form)
  const rate = useWatch(["growth", "rate"], form)
  const min = useWatch(["growth", "min"], form)
  const max = useWatch(["growth", "max"], form)

  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);

  return (
    <Form
      form={form}
      initialValues={{
        ...props.timer,
        duration: formatMillisecondsmmss(props.timer.duration),
        growth: props.timer.growth
          ? {
            min: props.timer.growth.min ? formatMillisecondsmmss(props.timer.growth.min) : undefined,
            max: props.timer.growth.max ? formatMillisecondsmmss(props.timer.growth.max) : undefined,
            rate: props.timer.growth.rate
          }
          : undefined
      }}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      onFinish={(values) => {
        console.log(values);
        updateTimer(values, props.timer, TimerCRUDService);
        props.onFinish();
      }}
    >
      <Form.Item
        label="Label"
        name="label"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Duration"
        name="duration"
        rules={[
          { required: true },
          { validator: (_, value) => (validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss'))) },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Growth">
        <Row align='middle' style={{ paddingTop: '5px' }}>
          <Checkbox checked={showGrowth} onChange={(e) => setShowGrowth(e.target.checked)} />
        </Row>
      </Form.Item>
      {showGrowth && (
        <>
          <Form.Item
            label="Rate"
            name={["growth", "rate"]}
            rules={[{ required: true }]}
          >
            <InputNumber step={0.01} addonAfter={`${rate ? (rate * 100).toFixed(0) : 0} %`} />
          </Form.Item>
          <Form.Item
            label="Min"
            name={["growth", "min"]}
            rules={[
              { validator: (_, value) => (value === undefined || value === '' || validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss'))) },
              { validator: (_, value) => (validateMin(duration, value, max) ? Promise.resolve() : Promise.reject(new Error('Error: min is greater than duration or max'))) },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Max"
            name={["growth", "max"]}
            rules={[
              { validator: (_, value) => (value === undefined || value === '' || validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss'))) },
              { validator: (_, value) => (validateMax(duration, value, min) ? Promise.resolve() : Promise.reject(new Error('Error max is smaller than duration or min'))) },
            ]}
          >
            <Input />
          </Form.Item>
        </>
      )}
      <Row justify='end'>
        <Button
          type='primary'
          htmlType='submit'
        >
          Update
        </Button>
      </Row>
    </Form >
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
      <Card
        title="Complete timer document"
        type='inner'
        bordered={false}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: '0px' }}>
          {JSON.stringify(props.timer, null, 2)}
        </pre>
      </Card>
    </Modal >
  );
};

export default TimerModal;
