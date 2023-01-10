import React, { useState } from 'react';
import { useActor } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import {
  Button, Card, Checkbox, Col,
  List, Row, Select, Space, Statistic, Typography
} from 'antd';
import { DeleteOutlined, LikeOutlined } from '@ant-design/icons';
import { format, isToday } from 'date-fns';

import { formatMillisecondsHHmmss, formatMillisecondsmmss } from '../utils';
import { Session } from '../timerMachine/sessionMachine';
import { TimerRecordCRUDMachine } from '../timerMachine/appMachine';

const Records = ({ recordMachine, sessionMap }: { recordMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>, sessionMap: Map<string, Session> }) => {
  const [selectedSession, setSelectedSession] = useState<string | undefined>(undefined);
  const [onlyToday, setOnlyToday] = useState<boolean>(true);

  const [timerRecordCRUDState, timerRecordCRUDSend] = useActor(recordMachine);
  const filteredRecords = timerRecordCRUDState.context.docs
    .filter((r) => selectedSession ? r.sessionId === selectedSession : true)
    .filter((r) => onlyToday ? isToday(r.finalTime) : true)
    .sort((a, b) => b.finalTime - a.finalTime);
  const totalTime = filteredRecords.reduce((acc, x) => acc + x.millisecondsOriginalGoal, 0)

  return (
    <Card
      title={
        <Space>
          <Statistic title="Sessions" value={filteredRecords.length} prefix={<LikeOutlined />} />
          <Statistic title="Time" value={formatMillisecondsHHmmss(totalTime)} />
        </Space >
      }
      extra={(
        <Space>
          <Checkbox checked={onlyToday} onChange={(e) => setOnlyToday(e.target.checked)}>Only today</Checkbox>
          <Select
            style={{ width: '300px' }}
            allowClear
            onChange={(e) => setSelectedSession(e)}
            options={[...sessionMap.keys()].map((k) => ({
              value: k,
              label: sessionMap.get(k)?.title ?? '',
            }))}
          />
        </Space>
      )}
    >
      <List
        style={{ width: '100%' }}
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredRecords}
        renderItem={(i) => (
          <List.Item>
            <Row style={{ width: '100%' }}>
              <Col span={11}>
                <Typography.Paragraph>
                  {`Session: ${sessionMap.get(i.sessionId)?.title}`}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  {`Duration: ${formatMillisecondsmmss(i.millisecondsOriginalGoal)}`}
                </Typography.Paragraph>
              </Col>
              <Col span={11}>
                <Typography.Paragraph>
                  {`Stated on: ${format(i.finalTime - i.millisecondsOriginalGoal, 'HH:mm:ss aaaa')}`}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  {`Ended on: ${format(i.finalTime, 'HH:mm:ss aaaa')}`}
                </Typography.Paragraph>
              </Col>
              <Col span={2}>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => timerRecordCRUDSend({ type: 'DELETE', _id: i._id })}
                />
              </Col>
            </Row>
          </List.Item>
        )}
        pagination={{ pageSize: 10 }}
      />
    </Card >
  );
}

export default Records;