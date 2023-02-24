import React, { useEffect, useRef, useState } from 'react';
import { useActor, useSelector } from '@xstate/react';
import { format } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import alarm from '../assets/alarm10.wav';
import { TimerMachine } from '../../machines/v2/newTimerMachine';
import { formatMillisecondsHHmmss, formatMillisecondsmmss, formatMillisecondsmmssSSS, mmssToMilliseconds, validateInput } from '../../utils';
import { Button, Card, Col, Divider, Form, Input, Row, Select, Space, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, NodeCollapseOutlined, NodeExpandOutlined, PauseOutlined, PlayCircleOutlined, ReloadOutlined, SoundOutlined } from '@ant-design/icons';
import { alarmNames } from '../../services/alarmService';
import { Session } from '../../models';


type TimerIntervalViewProps = {
  timerActor: ActorRefFrom<TimerMachine>,
  session: Session,
  isCurrent?: boolean
  // onEdit: (_id: string) => void
  // onDelete: (_id: string) => void
  // onUpdate: (doc: Partial<Timer>) => void
}

const TimerIntervalView: React.FC<TimerIntervalViewProps> = (props) => {
  // const [form] = Form.useForm();

  // const [timerState, timerSend] = useActor(props.timerMachine);
  // const timerValue = timerState.value;
  // const timerDoc = timerState.context.timer;

  // const running = timerState.matches('clock.running');
  // const paused = timerState.matches('clock.paused');
  // const idle = timerState.matches('clock.idle');

  // const open = timerState.matches('view.open');

  // const id = timerState.context._id;
  // const label = timerState.context.label;
  // const sound = timerState.context.sound;
  // const finalTime = timerState.context.finalTime;
  // const millisecondsLeft = timerState.context.millisecondsLeft;
  // const millisecondsOriginalGoal = timerState.context.millisecondsOriginalGoal;
  // const millisecondsInput = timerState.context.millisecondsInput;

  // const showFinalTime = idle && finalTime;

  // const [isInputInvalid, setIsInputInvalid] = useState<boolean>(false);

  const timerDoc = useSelector(props.timerActor, ({ context }) => context.timer)

  return (
    <Row style={{ width: '100%', paddingLeft: '16px', paddingRight: '16px' }} align='middle'>
      <Typography.Text
        style={{ flex: 2 }}
      // editable={{ onChange: (e) => props.onUpdate({ label: e }) }}
      >
        {timerDoc.label}
      </Typography.Text>
      <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
      <Select
        style={{ flex: 1 }}
        // onChange={(e) => props.onUpdate({ sound: e })}
        value={timerDoc.sound}
        options={alarmNames.map((a) => ({ label: a, value: a }))}
      />
      <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
      <Typography.Text>
        {formatMillisecondsHHmmss(timerDoc.originalTime)}
      </Typography.Text>
      <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
      {/* <Button icon={<EditOutlined />} onClick={() => props.onEdit(id)} /> */}
      <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
      {/* <Button icon={<DeleteOutlined />} onClick={() => props.onDelete(id)} /> */}
    </Row>
  );
}

export default TimerIntervalView;