import React, { useEffect, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { format } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import alarm from '../assets/alarm10.wav';
import { TimerMachine } from '../../timerMachine/timerMachine';
import { formatMillisecondsHHmmss, formatMillisecondsmmss, formatMillisecondsmmssSSS, mmssToMilliseconds, validateInput } from '../../utils';
import { Button, Card, Col, Divider, Form, Input, Row, Space, Typography } from 'antd';
import { NodeCollapseOutlined, NodeExpandOutlined, PauseOutlined, PlayCircleOutlined, ReloadOutlined, SoundOutlined } from '@ant-design/icons';


type TimerViewIntervalModeProps = {
  timerMachine: ActorRefFrom<TimerMachine>,
  sessionTitle?: string,
  isCurrent?: boolean
}

const TimerViewIntervalMode: React.FC<TimerViewIntervalModeProps> = ({ timerMachine, sessionTitle = 'Session', isCurrent = false }) => {
  const [form] = Form.useForm();

  const [timerState, timerSend] = useActor(timerMachine);
  const timerValue = timerState.value;

  const running = timerState.matches('clock.running');
  const paused = timerState.matches('clock.paused');
  const idle = timerState.matches('clock.idle');

  const open = timerState.matches('view.open');

  const finalTime = timerState.context.finalTime;
  const millisecondsLeft = timerState.context.millisecondsLeft;
  const millisecondsOriginalGoal = timerState.context.millisecondsOriginalGoal;
  const millisecondsInput = timerState.context.millisecondsInput;

  const showFinalTime = idle && finalTime;

  const [isInputInvalid, setIsInputInvalid] = useState<boolean>(false);

  return (
    <Row style={{ width: '100%', paddingLeft: '16px', paddingRight: '16px' }} align='middle'>
      <Typography.Text style={{ flex: 1 }}>
        Label
      </Typography.Text>
      <Divider type='vertical' style={{ borderColor: 'lightgrey' }} />
      <Typography.Text>
        {formatMillisecondsHHmmss(millisecondsOriginalGoal)}
      </Typography.Text>
    </Row>
  );
}

export default TimerViewIntervalMode;