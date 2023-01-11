import React, { useContext } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { AppMachine } from './timerMachine/appMachine';
import { isEmpty } from './utils';
import {
  Button, Col, Divider, Layout,
  Row, Space, Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SessionView from './pages/SessionView';
import Records from './components/Records';
import { GlobalServicesContext } from './services/contextService';

type SessionContentProps = {}

const SessionContent: React.FC<SessionContentProps> = () => {
  const { appService, sessionCRUDActor, timerCRUDActor, timerRecordCRUDActor } = useContext(GlobalServicesContext);
  const sessionActors = useSelector(appService, ({ context }) => context.sessions);

  return (
    <>
      <Space>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Sessions
        </Typography.Title>
        <Button
          icon={<PlusOutlined />}
          onClick={() => sessionCRUDActor.send({
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
                key={sessionActor.id}
                sessionMachine={sessionActor}
                timerCRUDMachine={timerCRUDActor}
                recordCRUDMachine={timerRecordCRUDActor}
                updateSession={(session) => sessionCRUDActor.send({
                  type: 'UPDATE',
                  _id: session._id,
                  doc: session
                })}
                deleteSession={(session) => sessionCRUDActor.send({
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

type RecordsContentProps = {}

const RecordsContent: React.FC<RecordsContentProps> = () => {
  const { sessionCRUDActor, timerRecordCRUDActor } = useContext(GlobalServicesContext);
  const sessionDocsMap = useSelector(sessionCRUDActor, ({ context }) => context.docsMap);

  return (
    <>
      <Typography.Title level={2} style={{ marginTop: 12 }}>
        Records
      </Typography.Title>
      <Divider />
      <Col span={12}>
        <Records recordMachine={timerRecordCRUDActor} sessionMap={sessionDocsMap} />
      </Col>
    </>
  );
};

const Footer: React.FC = () => {
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

type LoadedAppProps = {}

const LoadedApp: React.FC<LoadedAppProps> = () => {
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
        <SessionContent />
        <Divider />
        <RecordsContent />
        <Divider />
        <Footer />
      </Layout.Content>
    </Layout >
  )
}

const App = () => {
  const appService = useInterpret(AppMachine);

  const sessionCRUDActor = useSelector(appService, ({ context }) => context.sessionCRUDMachine);
  const timerCRUDActor = useSelector(appService, ({ context }) => context.timerCRUDMachine);
  const timerRecordCRUDActor = useSelector(appService, ({ context }) => context.timerRecordCRUDMachine);

  const isAppLoaded = !isEmpty(sessionCRUDActor) && !isEmpty(timerCRUDActor) && !isEmpty(timerRecordCRUDActor);

  return isAppLoaded ? (
    <GlobalServicesContext.Provider
      value={{
        appService,
        sessionCRUDActor,
        timerCRUDActor,
        timerRecordCRUDActor,
      }}
    >
      <LoadedApp />
    </GlobalServicesContext.Provider >
  ) : <>Loading</>;
}

export default App;
