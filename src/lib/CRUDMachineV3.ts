// v3.0
/* eslint-disable quotes */
/* eslint-disable max-len */
import { createMachine, assign, sendParent } from 'xstate';
// import RemoteRepository from './RemoteRepository';
import Repository, { NewDoc, BaseDoc } from './RepositoryV3';

const docsToDocsMap = <T extends BaseDoc>(docs: T[]): Map<string, T> => new Map(docs
  .filter((x) => !!x._id || x._id !== '')
  .map((x) => [x._id as string, x]));

// https://stackoverflow.com/questions/28010444/react-efficient-updating-of-array-state
export type CRUDContext<T extends BaseDoc> = {
  docs: T[]
  docsMap: Map<string, T>
  selectedDoc?: T | undefined
};

type BasicCRUDEvent<T extends BaseDoc> =
  | { type: 'CREATE'; doc: NewDoc<T> | (NewDoc<T>[]); }
  | { type: 'UPDATE'; _id: string | undefined; doc: Partial<T>; }
  | { type: 'DELETE'; _id: string | undefined; }

type BatchCRUDEvent<T extends BaseDoc> = { type: 'BATCH'; data: BasicCRUDEvent<T>[]; }

export type CRUDEvent<T extends BaseDoc> =
  | BasicCRUDEvent<T>
  | BatchCRUDEvent<T>

// type Repo<T> = Repository<T> | RemoteRepository<T>
type Repo<T extends BaseDoc> = Repository<T>

const _createCRUDMachine = <T extends BaseDoc>(repo: Repo<T>) =>
  /** @xstate-layout N4IgpgJg5mDOIC5QGMBOBXCBZAhsgFgJYB2YAdAGY6EA26qYAxANoAMAuoqAA4D2shAC6FexLiAAeiAIwBWAMxkAHAE5WslQHYAbNs1L5czQBoQAT0QAmTYo3b5szQBYn0h9YC+H02ky4CJOQUhKiwggBKYDgQJFCMEKLkJABuvADW5L7YeESklCFhkdGxCCm8yDjComzsNeJ8AlViSJKIALTaZNLaTuqWKkpOSqwqlk7aphYIlmNkrrqWSrLDetrdXj4Y2QF5waERUTHEcWCoqLyoZNw0lRQXALZkWf65QQUHxcelxKkVTTV1FoNIQiZqgKTTBRkTSOJTSOHSfqyfqWSYyVhKLq6NbydzODYgZ45QJkBifOIJPJlDJPLYvElko5Qb6-SqggEcer8EGicQQyzqMgaeQw3HSViWeyyJxohAilRkNbwlTyezaSzyJYEok7ciM2KMU7nS7XW4PWl+Yl5fVfMp-dkcQE8blNPmIIadaRDFzaVjeyyyaQmcxWBxdMZaXEIyV6bV0q1JCA0JgAYXCAFEAIIAFXTTpAwNdLX58lYitYcl92hUVZUslksu0gbIfusQ00kt6628hPjurIhCTTAAqgAFAAiObznKBLtBbumpa6vQ0Oj0BiMsqUTbIWicKnFy3kdekKjjlv7g+TjHH6YAMunc-nC-Pi6HpEKlgNWOphgGnPIsrikoljKAeCwSqWciWOe2yvLSUTCMcADKpzJIQyBMJSSQ-OkmR9vBaCIbEqGoOhmEsuUbLVI6M7Oo0r7gogmjOEKhhjMeNbbpoKiNjMZCGOqGIAZoQZwrB9J5ERbIoWhGFMEaFxXDcgh3Kgjw6oRZJIVApHkWAlH2jRtR0QWc68m+CA1qBsjqk4HbqOuGqNiq0KjDxdauPCawSQmZDoNwEAybpcmYfEiQDrhNKaSSAVBTpenyYZ1HEBynCzgxFlMQgLGgfZTa1j+QxbpqcwDCKEoqPZizyL5-ZxcFiVhYpJoqWpGkEbFgWNaFBl2ilaVcplYKtFZvpCqwLFKEozgqNZqIhlZrCdDM+6SnI0HInV8EQGAyYJb14VUlF+EXjte1gAdZFJf1-y0el9E8iNEIsU40IFWoIGrYMQF+gq3SyBiPTbss6jbSSu37SRh0tcpZrqRacEQxdV36cld0mQ9ZnDQu1ludogwGDNzisIBi3SIisiKvMTgagBIowl4PbELwu3wC0MWkENT0Lh0nSk4ivr9Kebg-YtbRvbiUZwn64oerVPac0E1B0Aw3NFtl9kKsKziA-MOiqiVWK6Ke1iGOxCubGdJJ7IUhyxOrjGjW08ItuxQsHgemoyotBjG2sGodjYMxnornXWvbxyO1lo32R+XE2FoGJA2TUy9IoPHdJYG3VpNlu9tbVJDtHz0yJoio9Bix6V163RKLKtPl8LPTZzo9b9ODUnadD12YSXC7jAqui9E29aOL0vGLeq5fStYAy2RT+hOJ35ANaj8n95Z4zl76KpfUMowjFutNzLNAZBhtjNh4X5CQ5dPf6ZvmvVmBRNqHI03Z79GgCeBriqriasmgmYeCAA */
  createMachine({
    tsTypes: {} as import("./CRUDMachineV3.typegen").Typegen0,
    schema: {
      context: {} as CRUDContext<T>,
      events: {} as CRUDEvent<T>,
      services: {} as {
        readDocs: { data: T[] },
        createDoc: { data: T | T[] },
        updateDoc: { data: number },
        deleteDoc: { data: number },
      }
    },
    context: {
      docs: [],
      selectedDoc: undefined,
      docsMap: new Map<string, T>([]),
    },
    id: `${repo.collection}CRUDMachine`,
    initial: "firstReading",
    predictableActionArguments: true,
    preserveActionOrder: true,
    states: {
      failure: {
        always: 'idle',
        entry: "logError"
      },

      firstReading: {
        invoke: {
          src: "readDocs",
          onDone: [
            {
              target: "idle",
              actions: ["saveReadDocs", "createDocsMap", "sendFirstRead"],
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      },

      reading: {
        invoke: {
          src: "readDocs",
          onDone: [
            {
              target: "idle",
              actions: ["saveReadDocs", "createDocsMap", "sendRead"],
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      },

      idle: {
        on: {
          CREATE: {
            target: "creatingService",
          },
          UPDATE: {
            target: "updatingService",
          },
          DELETE: {
            target: "deletingService",
          },
          BATCH: {
            target: "batchProcessing",
          },
        },
      },

      batchProcessing: {
        invoke: {
          src: "batch",
          onDone: [
            {
              target: "reading",
              actions: ["createDocsMap"],
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      },

      creatingService: {
        invoke: {
          src: "createDoc",
          onDone: [
            {
              target: "reading",
              actions: ['sendCreate']
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      },

      updatingService: {
        invoke: {
          src: "updateDoc",
          onDone: [
            {
              target: "reading",
              actions: ['sendUpdate']
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      },

      deletingService: {
        invoke: {
          src: "deleteDoc",
          onDone: [
            {
              target: "reading",
              actions: ['sendDelete']
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      }
    },
  }, {
    actions: {
      saveReadDocs: assign((_, event) => ({ docs: event.data, })),
      createDocsMap: assign((context) => ({ docsMap: docsToDocsMap(context.docs), })),
      logError: () => console.log('error'),
      // Parent message passing
      sendFirstRead: sendParent((_, event) => ({ type: 'FROM_CRUD_FIRST_READ', collection: repo.collection, docs: event.data })),
      sendRead: sendParent((_, event) => ({ type: 'FROM_CRUD_READ', collection: repo.collection, docs: event.data })),
      sendCreate: sendParent((_, event) => ({ type: 'FROM_CRUD_CREATE', collection: repo.collection, docs: event.data })),
      sendUpdate: sendParent((_, event) => ({ type: 'FROM_CRUD_UPDATE', collection: repo.collection, docs: event.data })),
      sendDelete: sendParent((_, event) => ({ type: 'FROM_CRUD_DELETE', collection: repo.collection, docs: event.data })),
      // sendFirstRead: () => {},
      // sendRead: () => { },
      // sendCreate: () => { },
      // sendUpdate: () => { },
      // sendDelete: () => { },
    },
    services: {
      createDoc: (_, event: CRUDEvent<T>) => {
        if (event.type === 'CREATE') return repo.create(event.doc);
        return Promise.resolve([]);
      },
      readDocs: () => repo.read(),
      updateDoc: (_, event: CRUDEvent<T>) => {
        if (event.type === 'UPDATE') return repo.update(event._id ?? '', event.doc);
        return Promise.resolve(0);
      },
      deleteDoc: (_, event: CRUDEvent<T>) => {
        if (event.type === 'DELETE') return repo.delete(event._id ?? '');
        return Promise.resolve(0);
      },
      batch: async (_, event) => {
        await Promise.all(event.data.map((op) => {
          if (op.type === 'CREATE') return repo.create(op.doc);
          if (op.type === 'UPDATE') return repo.update(op._id ?? '', op.doc);
          if (op.type === 'DELETE') return repo.delete(op._id ?? '');
          return Promise.resolve(0);
        }));
        return Promise.resolve(0);
      },
    },
    guards: {},
  })

export const createCRUDMachine = <T extends BaseDoc, U extends string | Repo<T> = string | Repo<T>>(repositoryOrCollection: U, location: U extends string ? 'local' | 'remote' : undefined) => {
  if (typeof repositoryOrCollection !== 'string') {
    return _createCRUDMachine<T>(repositoryOrCollection);
  }
  if (location === 'local') {
    const Collection = new Repository<T>(repositoryOrCollection);
    return _createCRUDMachine<T>(Collection);
  }
  const Collection = new Repository<T>(repositoryOrCollection);
  // const Collection = new RemoteRepository<T>(repositoryOrCollection);
  return _createCRUDMachine<T>(Collection);
};

export type CRUDStateMachine = typeof _createCRUDMachine;
export type NotLazyCRUDStateMachine<T extends BaseDoc> = ReturnType<typeof _createCRUDMachine<T>>;

export default createCRUDMachine;
