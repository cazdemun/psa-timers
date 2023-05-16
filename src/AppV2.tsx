import React, { useContext } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { getLastIndexFirstLevel, getNextIndex } from './utils';
import {
  Button, Col, Divider, Layout,
  Row, Space, Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { AppService } from './machines/v2/appService';
import GlobalServicesContext from './context/GlobalServicesContext';
import SessionIntervalView from './pages/session/SessionIntervalView';
import { addNewUserSessions } from './services/preConfiguredSessionsService';
import Chronos from './pages/chronos';

type NewUserButtonProps = {
}

const NewUserButton: React.FC<NewUserButtonProps> = (props) => {
  const { service } = useContext(GlobalServicesContext);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);
  const TimerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  return (
    <>
      <Col span={24}>
        <Row justify='center'>
          <Button size='large' onClick={() => addNewUserSessions(SessionCRUDService, TimerCRUDService)}>
            Add pre-configured timers
          </Button>
        </Row>
      </Col>
      <Col span={24}>
        List of timers:
      </Col>
    </>
  );
};

const Footer: React.FC = () => {
  return (
    <Col span={24}>
      <h2>Disclaimer</h2>
      <p>Some sounds belongs to Microsoft, <a href="www.online-stopwatch.com">www.online-stopwatch.com</a> and <a href="www.tomatotimers.com">www.tomatotimers.com</a></p>
    </Col>
  );
};

const App = () => {
  const service = useInterpret(AppService);

  const sessions = useSelector(service, ({ context }) => context.sessions);

  const SessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);
  const sessionsDocs = useSelector(SessionCRUDService, ({ context }) => context.docs);

  const sessionLastIndex = getLastIndexFirstLevel(sessionsDocs);

  return (
    <GlobalServicesContext.Provider value={{ service }}>
      <Layout style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Layout.Header>
          <Row style={{ height: '100%' }} align='middle'>
            <Typography.Title level={3} style={{ margin: 0, color: 'white' }}>
              PSA Timers
            </Typography.Title>
          </Row>
        </Layout.Header>
        <Layout.Content style={{ padding: '0px 12px' }}>
          <Divider />
          <Chronos />
          <Divider />
          <Space>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Sessions
            </Typography.Title>
            <Button
              icon={<PlusOutlined />}
              onClick={() => SessionCRUDService.send({
                type: 'CREATE',
                doc: {
                  created: Date.now(),
                  index: getNextIndex(sessionLastIndex),
                  timers: [],
                  title: 'New session',
                  sound: 'inhale_alarm',
                },
              })}
            />
          </Space>
          <Divider />
          <Row gutter={[16, 16]}>
            {
              sessions.length === 0
                ? (
                  <NewUserButton />
                ) : sessions
                  .map((session) => (
                    <SessionIntervalView
                      key={session.id}
                      sessionActor={session}
                    />
                  ))
            }
          </Row>
          <Divider />
          <Footer />
        </Layout.Content>
      </Layout >

    </GlobalServicesContext.Provider >
  );
}

export default App;

/* <Row>
    <Col span={12}>
      <DebugModule<Session>
        crudService={SessionCRUDService}
        docs={
          sessionsDocs
            .slice()
            .sort((a, b) => sortByIndex(a, b))
        }
        newDoc={{
          created: Date.now(),
          index: getNextIndex(sessionLastIndex),
          timers: [],
          title: 'New session',
          sound: 'inhale_alarm',
        }}
        updateDoc={(doc) => doc}
        pageSize={5}
      />
    </Col>
    <Col span={12}>
      <DebugModule<Timer>
        crudService={timerCRUDService}
        pageSize={3}
      />
    </Col>
  </Row> */
