import React from 'react';
import { Button, Card, List, Space } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { BaseDoc, NewDoc } from '../../lib/RepositoryV3';
import { deleteItemWithConfirm } from '../../utils';
import { NotLazyCRUDStateMachine } from '../../lib/CRUDMachineV3';

type DebugModuleProps<T extends BaseDoc> = {
  crudService: ActorRefFrom<NotLazyCRUDStateMachine<T>>
  newDoc?: NewDoc<T>
  updateDoc?: (doc: T) => Partial<T>
  docs?: T[]
}

const DebugModule = <T extends BaseDoc>(props: DebugModuleProps<T>) => {
  const docs = useSelector(props.crudService, ({ context }) => context.docs);
  const collection = useSelector(props.crudService, ({ context }) => context.collection);
  return (
    <Card
      title={collection}
      extra={(
        <Button
          icon={<PlusOutlined />}
          onClick={() => props.newDoc && props.crudService.send({ type: 'CREATE', doc: props.newDoc })}
        >
          Add
        </Button>
      )}
    >
      <List
        dataSource={props.docs ?? docs}
        pagination={{ pageSize: 5 }}
        renderItem={(doc) => (
          <List.Item
            style={{ alignItems: 'start' }}
            extra={(
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => props.updateDoc && props.crudService.send({ type: 'UPDATE', _id: doc._id, doc: props.updateDoc(doc) })}
                />
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => deleteItemWithConfirm(props.crudService, doc._id)}
                />
              </Space>
            )}
          >
            <pre>{JSON.stringify(doc, null, 2)}</pre>
          </List.Item>
        )}
      />
    </Card>
  );
}

export default DebugModule;
