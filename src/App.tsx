import React from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { ActorRefFrom, InterpreterFrom } from 'xstate';
import { AppMachine, SessionCRUDMachine, TimerCRUDMachine, TimerRecordCRUDMachine } from './timerMachine/appMachine';
import { isEmpty } from './utils';
import {
  Button, Col, Divider, Layout,
  Row, Space, Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SessionView from './pages/SessionView';
import Records from './components/Records';

type SessionContentProps = {
  sessionManagerService: InterpreterFrom<typeof AppMachine>
  sessionCRUDActor: ActorRefFrom<typeof SessionCRUDMachine>
  timerCRUDActor: ActorRefFrom<typeof TimerCRUDMachine>
  timerRecordCRUDActor: ActorRefFrom<typeof TimerRecordCRUDMachine>
}

const SessionContent: React.FC<SessionContentProps> = (props) => {
  const sessionActors = useSelector(props.sessionManagerService, ({ context }) => context.sessions);

  return (
    <>
      <Space>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Sessions
        </Typography.Title>
        <Button
          icon={<PlusOutlined />}
          onClick={() => props.sessionCRUDActor.send({
            type: 'CREATE',
            doc: {
              timers: [10000],
              title: 'New Session',
            },
          })}
        />
      </Space>
      <Divider />
      <Col span={24}>
        <Row gutter={[8, 16]}>
          {sessionActors
            .map((sessionActor, i) => (
              <SessionView
                key={i.toString()}
                sessionMachine={sessionActor}
                timerCRUDMachine={props.timerCRUDActor}
                recordCRUDMachine={props.timerRecordCRUDActor}
                updateSession={(session) => props.sessionCRUDActor.send({
                  type: 'UPDATE',
                  _id: session._id,
                  doc: session
                })}
                deleteSession={(session) => props.sessionCRUDActor.send({
                  type: 'DELETE',
                  _id: session,
                })}
              />
            ))}
        </Row>
      </Col>
    </>
  );
};

type RecordsContentProps = {
  sessionCRUDActor: ActorRefFrom<typeof SessionCRUDMachine>
  timerRecordCRUDActor: ActorRefFrom<typeof TimerRecordCRUDMachine>
}

const RecordsContent: React.FC<RecordsContentProps> = (props) => {
  const sessionDocsMap = useSelector(props.sessionCRUDActor, ({ context }) => context.docsMap);
  return (
    <>
      <Typography.Title level={2} style={{ marginTop: 12 }}>
        Records
      </Typography.Title>
      <Divider />
      <Col span={12}>
        <Records recordMachine={props.timerRecordCRUDActor} sessionMap={sessionDocsMap} />
      </Col>
    </>
  );
};

const Footer: React.FC = (props) => {
  return (
    <Col span={24}>
      <h2>Notes</h2>
      <ul>
        <li>Soft reset restarts the timer when is running and keeps going</li>
        <li>Hard reset restarts the timer when is paused and stops it, allowing new input</li>
      </ul>
      <p>Disclaimer: sounds belongs to Microsoft and www.online-stopwatch.com</p>
    </Col>
  );
};

type LoadedAppProps = {
  sessionManagerService: InterpreterFrom<typeof AppMachine>
  timerCRUDMachine: ActorRefFrom<typeof TimerCRUDMachine>
  sessionCRUDMachine: ActorRefFrom<typeof SessionCRUDMachine>
  timerRecordCRUDMachine: ActorRefFrom<typeof TimerRecordCRUDMachine>
}

const LoadedApp: React.FC<LoadedAppProps> = (props) => {
  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Layout.Header>
        <Row style={{ height: '100%' }} align='middle'>
          <Typography.Title level={3} style={{ margin: 0, color: 'white' }}>
            PSA Timers
          </Typography.Title>
        </Row>
      </Layout.Header>
      <Layout.Content style={{ padding: '0px 40px' }}>
        <Divider />
        <SessionContent
          sessionCRUDActor={props.sessionCRUDMachine}
          timerRecordCRUDActor={props.timerRecordCRUDMachine}
          timerCRUDActor={props.timerCRUDMachine}
          sessionManagerService={props.sessionManagerService}
        />
        <Divider />
        <RecordsContent
          sessionCRUDActor={props.sessionCRUDMachine}
          timerRecordCRUDActor={props.timerRecordCRUDMachine}
        />
        <Divider />
        <Footer />
      </Layout.Content>
    </Layout >
  )
}

const App = () => {
  const sessionManagerService = useInterpret(AppMachine);

  const sessionCRUDMachine = useSelector(sessionManagerService, ({ context }) => context.sessionCRUDMachine);
  const timerRecordCRUDMachine = useSelector(sessionManagerService, ({ context }) => context.timerRecordCRUDMachine);
  const timerCRUDMachine = useSelector(sessionManagerService, ({ context }) => context.timerCRUDMachine);

  const isAppLoaded = !isEmpty(sessionCRUDMachine) && !isEmpty(timerRecordCRUDMachine) && !isEmpty(timerCRUDMachine);

  return isAppLoaded ? (
    <LoadedApp
      sessionCRUDMachine={sessionCRUDMachine}
      timerRecordCRUDMachine={timerRecordCRUDMachine}
      timerCRUDMachine={timerCRUDMachine}
      sessionManagerService={sessionManagerService}
    />
  ) : <>Loading</>;
}

export default App;
