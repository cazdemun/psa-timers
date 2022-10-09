import React, { useState } from 'react';
import { useActor } from '@xstate/react';
import { format } from 'date-fns';
import { ActorRefFrom, StateFrom } from 'xstate';
import alarm from '../assets/alarm10.wav';
import { TimerMachine } from '../timerMachine/timerMachine';
import { formatMillisecondsmmss, formatMillisecondsmmssSSS, mmssToMilliseconds, validateInput } from '../utils';
import { Button, Card, Col, Row, Space } from 'antd';
import { CaretLeftOutlined, PauseOutlined, PlayCircleOutlined, ReloadOutlined, SoundOutlined } from '@ant-design/icons';

const PRESETS = [...Array(9).keys()]
  .map((i) => (i + 2))
  // .map((i) => (i + 1) * 2)
  .map((i) => ({
    milliseconds: i * 60 * 1000,
    label: formatMillisecondsmmss(i * 60 * 1000),
  }));

const TimerView = ({ timer, isCurrent = false }: { timer: ActorRefFrom<TimerMachine>, isCurrent?: boolean }) => {
  const [timerState, timerSend] = useActor(timer);
  const timerValue = timerState.value;

  const running = timerState.matches('running');
  const paused = timerState.matches('paused');
  const idle = timerState.matches('idle');

  const finalTime = timerState.context.finalTime;
  const millisecondsLeft = timerState.context.millisecondsLeft;
  const millisecondsOriginalGoal = timerState.context.millisecondsOriginalGoal;
  const millisecondsInput = timerState.context.millisecondsInput;

  const showFinalTime = idle && finalTime;

  const [startTime, setstartTime] = useState<string>(millisecondsInput);
  const [startTimeError, setstartTimeStringError] = useState<string>('');

  const displayStyle = (s: StateFrom<TimerMachine>) => {
    if (s.matches('running')) return { marginBottom: '0px', fontSize: '18px' };
    if (s.matches('paused')) return { marginBottom: '32px', fontSize: '18px' };
    return undefined;
  }

  const inputStyle = (startTimeError: string, showFinalTime: boolean) => {
    if (startTimeError === '' && !showFinalTime) return { marginBottom: '36px' };
    return undefined;
  }

  return (
    <Row
      style={{
        borderTop: '2px solid lightgrey',
        borderBottom: '2px solid lightgrey',
        borderLeft: '2px solid lightgrey',
      }}
    >
      <Col span={12}>
        <Card
          type="inner"
          title={`Timer (${timerValue}) ${isCurrent ? '★' : ''}`}
          style={{ height: '100%' }}
          extra={(<Button shape="circle" icon={<SoundOutlined />} onClick={() => (new Audio(alarm)).play()} />)}
        >
          <Row justify='center'>
            {!idle && (
              <p style={displayStyle(timerState)}>
                {formatMillisecondsmmssSSS(millisecondsLeft)}
              </p>
            )}
            {idle && (
              <input
                style={inputStyle(startTimeError, Boolean(showFinalTime))}
                disabled={!idle}
                value={startTime}
                onChange={(e) => {
                  if (validateInput(e.target.value)) {
                    setstartTimeStringError('');
                    timerSend({
                      type: 'UPDATE',
                      newMillisecondsGoals: e.target.value,
                    });
                  } else {
                    setstartTimeStringError('error parsing mm:ss');
                  }
                  setstartTime(e.target.value);
                }}
              />
            )}
          </Row>
          <Row>
            {running && <p style={{ marginTop: '0', fontSize: '12px' }}>Ends on: {format(Date.now() + millisecondsLeft, 'HH:mm:ss aaaa')}</p>}
            {showFinalTime && <p style={{ marginTop: '0', fontSize: '12px' }}>Ended on: {format(finalTime, 'HH:mm:ss aaaa')}</p>}
            {startTimeError !== '' && <p style={{ marginTop: '0', color: 'red' }}>{startTimeError}</p>}
          </Row>
          <Row justify='center'>
            <Space>
              {idle && (
                <Button
                  shape="circle"
                  icon={<PlayCircleOutlined />}
                  disabled={startTimeError !== ''}
                  onClick={() => {
                    if (startTimeError === '') {
                      timerSend({
                        type: 'START',
                        newMillisecondsGoals: mmssToMilliseconds(millisecondsInput),
                      })
                    }
                  }}
                />
              )}
              {paused && (
                <Button
                  shape="circle"
                  icon={<PlayCircleOutlined />}
                  onClick={() => timerSend({ type: 'RESUME' })}
                />
              )}
              {running && (
                <Button
                  shape="circle"
                  icon={<PauseOutlined />}
                  onClick={() => timerSend({ type: 'PAUSE' })}
                />
              )}
              <Button
                shape="circle"
                disabled={!(running || paused)}
                onClick={() => timerSend({ type: 'RESET' })}
                icon={<ReloadOutlined />}
              />
            </Space>
          </Row>
          <Row justify='center'>
            {(running || paused) && <p>{`${running ? 'Soft' : 'Hard'} Reset ${formatMillisecondsmmss(millisecondsOriginalGoal)}`}</p>}
          </Row>
        </Card>
      </Col>
      <Col span={12}>
        <Card
          type="inner"
          title="Presets"
          style={{ height: '100%' }}
          extra={(<Button shape="circle" disabled icon={<CaretLeftOutlined />} />)}
        >
          <span
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {PRESETS.map((i) => (
              <Button
                key={i.milliseconds.toString()}
                disabled={!idle}
                style={{
                  flex: 'none',
                }}
                onClick={() => {
                  setstartTime(i.label);
                  setstartTimeStringError('');
                  timerSend({
                    type: 'UPDATE',
                    newMillisecondsGoals: i.label,
                  });
                }}
              >
                {i.label}
              </Button>
            ))}
          </span>
        </Card>
      </Col>
    </Row>
  );
}

export default TimerView;