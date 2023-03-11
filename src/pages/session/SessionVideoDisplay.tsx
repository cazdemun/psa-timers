import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from '@xstate/react';
import { format } from 'date-fns';
import { ActorRefFrom } from 'xstate';
import { formatMillisecondsmmssSSS } from '../../utils';
import { Row } from 'antd';
import { TimerMachine } from '../../machines/v2/newTimerMachine';

type SessionVideoDisplayProps = {
  timerActor: ActorRefFrom<TimerMachine>
  sessionTitle: string
  onVideoLoading?: (videoElement: HTMLVideoElement) => void
}

const SessionVideoDisplay: React.FC<SessionVideoDisplayProps> = (props) => {
  const running = useSelector(props.timerActor, (state) => state.matches('clock.running'));
  const idle = useSelector(props.timerActor, (state) => state.matches('clock.idle'));

  const timeLeft = useSelector(props.timerActor, ({ context }) => context.timeLeft);
  const timerDoc = useSelector(props.timerActor, ({ context }) => context.timer);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [firstVideoLoading, setFlipFlop] = useState<boolean>(true);

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
      canvasCtx.fillText(`${props.sessionTitle} / ${timerDoc.label}`, canvasEl.width / 2, canvasEl.height / 4);

      canvasCtx.font = '24px serif';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillStyle = "black";
      canvasCtx.fillText(formatMillisecondsmmssSSS(timeLeft), canvasEl.width / 2, 3 * canvasEl.height / 5);
      canvasCtx.font = '12px serif';
      canvasCtx.fillText(running ? `Ends on: ${format(Date.now() + timeLeft, 'HH:mm:ss aaaa')}` : '', canvasEl.width / 2, 4 * canvasEl.height / 5);
    }
  }, [timeLeft, props.sessionTitle, running, timerDoc.label])

  useEffect(() => {
    if (videoRef.current && canvasRef.current && firstVideoLoading) {
      const canvasEl = canvasRef.current as HTMLCanvasElement;
      const video = videoRef.current as HTMLVideoElement;
      video.srcObject = canvasEl.captureStream();
      video.play().catch((e) => console.log(e));
      setFlipFlop(false);

      props.onVideoLoading && props.onVideoLoading(video);
    }
  }, [timeLeft, firstVideoLoading, props])

  return (
    <Row style={{ borderRadius: 12, border: '1px solid darkgrey', }} justify='center' hidden={idle}>
      <canvas ref={canvasRef} width={150} height={100} hidden />
      <video ref={videoRef} muted hidden={idle} />
    </Row>
  );
}

export default SessionVideoDisplay;
