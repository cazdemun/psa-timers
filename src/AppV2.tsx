import React, { useContext } from 'react';
import { useInterpret, useSelector } from '@xstate/react';
import { AppMachine } from './machines/appMachine';
import { getLastIndexFirstLevel, getNextIndex, isEmpty, sortByIndex } from './utils';
import {
  Button, Col, Divider, Layout,
  Row, Space, Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SessionView from './pages/SessionView';
import Records from './components/Records';
import { AppService } from './machines/v2/appService';
import GlobalServicesContext from './context/GlobalServicesContext';
import { Session, Timer, TimerRecord } from './models';
import DebugModule from './components/debug';
import SessionIntervalView from './pages/session/SessionIntervalView';

// type SessionContentProps = {}

// const SessionContent: React.FC<SessionContentProps> = () => {
//   const { appService, sessionCRUDActor, timerCRUDActor, timerRecordCRUDActor } = useContext(GlobalServicesContext);
//   const sessionActors = useSelector(appService, ({ context }) => context.sessions);

//   return (
//     <>
//       <Space>
//         <Typography.Title level={2} style={{ margin: 0 }}>
//           Sessions
//         </Typography.Title>
//         <Button
//           icon={<PlusOutlined />}
//           onClick={() => sessionCRUDActor.send({
//             type: 'CREATE',
//             doc: {
//               timers: [10000],
//               title: 'New Session',
//             },
//           })}
//         />
//       </Space>
//       <Divider />
//       <Col span={24}>
//         <Row gutter={[8, 16]}>
//           {sessionActors
//             .map((sessionActor, i) => (
//               <SessionView
//                 key={sessionActor.id}
//                 sessionMachine={sessionActor}
//                 timerCRUDMachine={timerCRUDActor}
//                 recordCRUDMachine={timerRecordCRUDActor}
//                 updateSession={(session) => sessionCRUDActor.send({
//                   type: 'UPDATE',
//                   _id: session._id,
//                   doc: session
//                 })}
//                 deleteSession={(session) => sessionCRUDActor.send({
//                   type: 'DELETE',
//                   _id: session,
//                 })}
//               />
//             ))}
//         </Row>
//       </Col>
//     </>
//   );
// };

// type RecordsContentProps = {}

// const RecordsContent: React.FC<RecordsContentProps> = () => {
//   const { sessionCRUDActor, timerRecordCRUDActor } = useContext(GlobalServicesContext);
//   const sessionDocsMap = useSelector(sessionCRUDActor, ({ context }) => context.docsMap);

//   return (
//     <>
//       <Typography.Title level={2} style={{ marginTop: 12 }}>
//         Records
//       </Typography.Title>
//       <Divider />
//       <Col span={12}>
//         <Records recordMachine={timerRecordCRUDActor} sessionMap={sessionDocsMap} />
//       </Col>
//     </>
//   );
// };

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

// type LoadedAppProps = {}

// const LoadedApp: React.FC<LoadedAppProps> = () => {
//   return (
//     <Layout style={{ minHeight: '100vh', backgroundColor: 'white' }}>
//       <Layout.Header>
//         <Row style={{ height: '100%' }} align='middle'>
//           <Typography.Title level={3} style={{ margin: 0, color: 'white' }}>
//             PSA Timers
//           </Typography.Title>
//         </Row>
//       </Layout.Header>
//       <Layout.Content style={{ padding: '0px 40px' }}>
//         <Divider />
//         <SessionContent />
//         <Divider />
//         <RecordsContent />
//         <Divider />
//         <Footer />
//       </Layout.Content>
//     </Layout >
//   )
// }

const App = () => {
  const service = useInterpret(AppService);

  const value = useSelector(service, ({ value }) => value);
  const sessions = useSelector(service, ({ context }) => context.sessions);
  const timers = useSelector(service, ({ context }) => context.timers);

  const sessionCRUDService = useSelector(service, ({ context }) => context.sessionCRUDMachine);
  const sessionsDocs = useSelector(sessionCRUDService, ({ context }) => context.docs);

  const timerCRUDService = useSelector(service, ({ context }) => context.timerCRUDMachine);
  const timersDocs = useSelector(timerCRUDService, ({ context }) => context.docs);

  // const service = useContext(GlobalServicesContext);

  // const sessionCRUDActor = useSelector(appService, ({ context }) => context.sessionCRUDMachine);
  // const timerCRUDActor = useSelector(appService, ({ context }) => context.timerCRUDMachine);
  // const timerRecordCRUDActor = useSelector(appService, ({ context }) => context.timerRecordCRUDMachine);

  // const isAppLoaded = !isEmpty(sessionCRUDActor) && !isEmpty(timerCRUDActor) && !isEmpty(timerRecordCRUDActor);

  // return isAppLoaded ? (
  //   <GlobalServicesContext.Provider
  //     value={{
  //       service,
  //     }}
  //   >
  //     {/* <LoadedApp /> */}
  //   </GlobalServicesContext.Provider >
  // ) : <>Loading</>;

  const sessionLastIndex = getLastIndexFirstLevel(sessionsDocs);

  return (
    <GlobalServicesContext.Provider value={{ service }}>
      <pre>{JSON.stringify(value, null, 2)}</pre>
      <Row>
        <Col span={12}>
          <DebugModule<Session>
            crudService={sessionCRUDService}
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
      </Row>
      <Row gutter={[16, 16]}>
        {sessions
          .map((session) => (
            <SessionIntervalView
              key={session.id}
              sessionActor={session}
            />
          ))}
      </Row>
    </GlobalServicesContext.Provider >
  );
}

export default App;
