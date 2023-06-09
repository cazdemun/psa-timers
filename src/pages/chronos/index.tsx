import React, { useContext } from 'react';
import { useSelector } from '@xstate/react';
import {
  Button, Card, Col, Divider, Row, Space, Typography
} from 'antd';
import GlobalServicesContext from '../../context/GlobalServicesContext';
import { DownOutlined, RollbackOutlined, UpOutlined } from '@ant-design/icons';

// function formatMilliseconds(milliseconds: number) {
//   const duration = intervalToDuration({ start: 0, end: milliseconds });
//   return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'], zero: true });
// }

function formatMilliseconds(milliseconds: number) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  const formattedMilliseconds = String(milliseconds % 1000).padStart(3, '0');

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${formattedMilliseconds}`;

  return formattedTime;
}

type RewardSystemProps = {
}

const RewardSystem: React.FC<RewardSystemProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const RewardService = useSelector(service, ({ context }) => context.rewardActor);

  const stopwatchTime = useSelector(RewardService, ({ context }) => context.stopwatchTime);
  const recordedStopwatchTime = useSelector(RewardService, ({ context }) => context.recordedStopwatchTime);
  const timerTime = useSelector(RewardService, ({ context }) => context.timerTime);
  const factor = useSelector(RewardService, ({ context }) => context.factor);

  const stopwatchMode = useSelector(RewardService, (state) => state.matches('stopwatch'));
  const stopwatchIdle = useSelector(RewardService, (state) => state.matches('stopwatch.idle'));
  const stopwatchPaused = useSelector(RewardService, (state) => state.matches('stopwatch.paused'));
  const stopwatchRunning = useSelector(RewardService, (state) => state.matches('stopwatch.running'));

  const timerMode = useSelector(RewardService, (state) => state.matches('timer'));
  const timerPaused = useSelector(RewardService, (state) => state.matches('timer.paused'));
  const timerRunning = useSelector(RewardService, (state) => state.matches('timer.running'));

  const handleStartStopwatch = () => {
    RewardService.send({ type: 'START_STOPWATCH' });
  }

  const handlePauseStopwatch = () => {
    RewardService.send({ type: 'PAUSE_STOPWATCH' });
  }

  const handleStartTimer = () => {
    RewardService.send({ type: 'START_TIMER' });
  }

  const handlePauseTimer = () => {
    RewardService.send({ type: 'PAUSE_TIMER' });
  }

  return (
    <>
      <Space>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {`Reward System (${factor.toFixed(2)})`}
        </Typography.Title>
        <Button
          icon={<RollbackOutlined />}
          disabled={!(stopwatchPaused || timerPaused)}
          onClick={() => RewardService.send({ type: 'RESET_STOPWATCH' })}
        />
        <Button
          icon={<UpOutlined />}
          disabled={!stopwatchIdle}
          onClick={() => RewardService.send({ type: 'CHANGE_FACTOR', dir: 'up' })}
        />
        <Button
          icon={<DownOutlined />}
          disabled={!stopwatchIdle}
          onClick={() => RewardService.send({ type: 'CHANGE_FACTOR', dir: 'down' })}
        />
      </Space >
      <Divider />
      <Row gutter={[0, 16]}>
        <Col span={12} xs={24} sm={24} md={12} lg={12}>
          <Card title="Charge">
            <Col span={24}>
              <Typography.Title level={2}>{formatMilliseconds(stopwatchTime)}</Typography.Title>
              <Typography.Paragraph>
                {`Accumulated: ${formatMilliseconds(recordedStopwatchTime)}`}
              </Typography.Paragraph>
            </Col>
            <Col span={24}>
              <Button
                hidden={stopwatchRunning}
                disabled={timerRunning}
                onClick={handleStartStopwatch}
              >
                Start Stopwatch
              </Button>
              <Button
                hidden={stopwatchIdle || stopwatchPaused || timerMode}
                onClick={handlePauseStopwatch}
              >
                Pause Stopwatch
              </Button>
            </Col>
          </Card>
        </Col>
        <Col span={12} xs={24} sm={24} md={12} lg={12}>
          <Card title="Reward">
            <Col span={24}>
              <Typography.Title level={2}>{formatMilliseconds(timerTime)}</Typography.Title>
            </Col>
            <Col span={24}>
              <Button
                hidden={timerRunning}
                disabled={stopwatchIdle || stopwatchRunning}
                onClick={handleStartTimer}
              >
                Start Timer
              </Button>
              <Button
                hidden={timerPaused || stopwatchMode}
                onClick={handlePauseTimer}
              >
                Pause Timer
              </Button>
            </Col>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default RewardSystem;
