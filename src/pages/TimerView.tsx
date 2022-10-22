import React, { useEffect, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { format } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import alarm from '../assets/alarm10.wav';
import { TimerMachine } from '../timerMachine/timerMachine';
import { formatMillisecondsmmss, formatMillisecondsmmssSSS, mmssToMilliseconds, validateInput } from '../utils';
import { Button, Card, Col, Form, Input, Row, Space } from 'antd';
import { NodeCollapseOutlined, NodeExpandOutlined, PauseOutlined, PlayCircleOutlined, ReloadOutlined, SoundOutlined } from '@ant-design/icons';

const PRESETS = [...Array(9).keys()]
  .map((i) => (i + 2))
  // .map((i) => (i + 1) * 2)
  .map((i) => ({
    milliseconds: i * 60 * 1000,
    label: formatMillisecondsmmss(i * 60 * 1000),
  }));

const TimerView = ({ timer, sessionTitle = 'Session', isCurrent = false }: {
  timer: ActorRefFrom<TimerMachine>, sessionTitle?: string, isCurrent?: boolean
}) => {
  const [timerState, timerSend] = useActor(timer);
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

  const [startTime, setstartTime] = useState<string>(millisecondsInput);
  const [isInputInvalid, setIsInputInvalid] = useState<boolean>(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [fliFlop, setfliFlop] = useState<boolean>(true);

  useEffect(() => {
    if (canvasRef.current) {
      const canvasEl = canvasRef.current as HTMLCanvasElement;
      const canvasCtx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
      canvasCtx.fillStyle = "white";
      canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      canvasCtx.fillRect(0, 0, canvasEl.width, canvasEl.height);

      canvasCtx.font = '12px serif';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillStyle = "black";
      canvasCtx.fillText(sessionTitle, canvasEl.width / 2, canvasEl.height / 4);

      canvasCtx.font = '24px serif';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillStyle = "black";
      canvasCtx.fillText(formatMillisecondsmmssSSS(millisecondsLeft), canvasEl.width / 2, 3 * canvasEl.height / 5);
      canvasCtx.font = '12px serif';
      canvasCtx.fillText(running ? `Ends on: ${format(Date.now() + millisecondsLeft, 'HH:mm:ss aaaa')}` : '', canvasEl.width / 2, 4 * canvasEl.height / 5);
    }
  }, [millisecondsLeft, sessionTitle, running])

  useEffect(() => {
    if (videoRef.current && canvasRef.current && fliFlop) {
      const canvasEl = canvasRef.current as HTMLCanvasElement;
      const video = videoRef.current as HTMLVideoElement;
      video.srcObject = canvasEl.captureStream();
      video.play().catch((e) => console.log(e));
      setfliFlop(false);
    }
  }, [millisecondsLeft, fliFlop])

  return (
    <Row
      style={{
        borderTop: '2px solid lightgrey',
        borderBottom: '2px solid lightgrey',
        borderLeft: '2px solid lightgrey',
      }}
    >
      <canvas ref={canvasRef} width={150} height={100} hidden />
      <Col id="clock" span={open ? 12 : 24}>
        <Card
          type="inner"
          title={`Timer (${(timerValue as any).clock}) ${isCurrent ? '★' : ''}`}
          style={{ height: '100%' }}
          extra={(
            <Space>
              <Button shape="circle" icon={<SoundOutlined />} onClick={() => (new Audio(alarm)).play()} />
              {!open && <Button shape="circle" icon={<NodeCollapseOutlined />} onClick={() => timerSend({ type: 'TOOGLE_COLLAPSE' })} />}
            </Space>
          )}
        >
          <Row>
            <Col id="display" span={open ? 24 : 12}>
              <Row justify='center'>
                <video ref={videoRef} muted hidden={idle} />
                <Form
                  initialValues={{
                    timerInput: startTime
                  }}
                >
                  <Form.Item
                    name="timerInput"
                    rules={[{
                      validator: (_, value) => (validateInput(value) ? Promise.resolve() : Promise.reject(new Error('Error parsing mm:ss')))
                    }]}
                  >
                    <Input
                      hidden={!idle}
                      disabled={!idle}
                      value={startTime}
                      onChange={(e) => {
                        if (validateInput(e.target.value)) {
                          setIsInputInvalid(false);
                          timerSend({
                            type: 'UPDATE',
                            newMillisecondsGoals: e.target.value,
                          });
                        } else {
                          setIsInputInvalid(true);
                        }
                        setstartTime(e.target.value);
                      }}
                    />
                  </Form.Item>
                </Form>
              </Row>
              <Row>
                {showFinalTime && <p style={{ marginTop: '0', fontSize: '12px' }}>Ended on: {format(finalTime, 'HH:mm:ss aaaa')}</p>}
              </Row>
            </Col>
            <Col id="controls" span={open ? 24 : 12}>
              <Row justify='center'>
                <Space>
                  {idle && (
                    <Button
                      shape="circle"
                      icon={<PlayCircleOutlined />}
                      disabled={isInputInvalid}
                      onClick={() => {
                        if (!isInputInvalid) {
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
            </Col>
          </Row>
        </Card>
      </Col>
      <Col id="presets" span={open ? 12 : 0}>
        <Card
          type="inner"
          title="Presets"
          style={{ height: '100%' }}
          extra={(
            <Space>
              {open && <Button shape="circle" icon={<NodeExpandOutlined />} onClick={() => timerSend({ type: 'TOOGLE_COLLAPSE' })} />}
            </Space>
          )}
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
                  setIsInputInvalid(false);
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