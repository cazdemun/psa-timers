/* eslint-disable quotes */
/* eslint-disable max-len */
import {
  createMachine, assign, sendParent
} from 'xstate';
import { pure } from 'xstate/lib/actions';
import RemoteRepository from './RemoteRepository';
import Repository from './Repository';

const docsToDocsMap = <T extends { _id: string }>(docs: T[]): Map<string, T> => new Map(docs
  .filter((x) => !!x._id || x._id !== '')
  .map((x) => [x._id as string, x]));

// https://stackoverflow.com/questions/28010444/react-efficient-updating-of-array-state
export type CRUDContext<T> = {
  docs: T[]
  docsMap: Map<string, T>
  selectedDoc?: T | undefined
  firstLoad: boolean
};

type BasicCRUDEvent<T> =
  | { type: 'CREATE'; doc: Omit<T, '_id'> | (Omit<T, '_id'>[]); }
  | { type: 'UPDATE'; _id: string | undefined; doc: Partial<T>; }
  | { type: 'DELETE'; _id: string | undefined; }

type BatchCRUDEvent<T> = { type: 'BATCH'; data: BasicCRUDEvent<T>[]; }

export type CRUDEvent<T> =
  | BasicCRUDEvent<T>
  | BatchCRUDEvent<T>

type Repo<T> = Repository<T> | RemoteRepository<T>

const _createCRUDMachine = <T extends { _id: string }>(repo: Repo<T>, article: string) => (
  /** @xstate-layout N4IgpgJg5mDOIC5QGMBOBXCA6ANgewEMIBLAOygGII9SwsyA3PAazoAoBbA5ACzLACUuQiXIJGeZAQAuxGgG0ADAF1EoAA55YxWTTUgAHogCMigMwB2LAE5FANkUAWAEwXHADgsBWLwBoQAJ6IZmZ2Nu4hXs7Wjope1hbuAL5J-miYwkRklGCoqHioWOo4MgBmBRxYnNx8tEL4WWISUrqkSqpIIJrarfpGCMaOjtZYg3ZeZo52iRb+QQjOXsZYis7GdtMeTnaeXilpGNjEEDhgFADKAKIAMpcAwgAqAPoAIgDyd-rdOnKkfYguObBMwjCZeCxucaKYxeRx7VIgdJHE5nO4AJUuAEEHpcvlofnpOv0zO5ltYJsYzOZxhZnO4gQg7I5lu53F5qfEXON9ojDvQURQAKoABRe2NxnW+vSJwVJNgpVNC4LpDOsIJWpIsIWmXg2Ox5SP5pwoLxulxxeJ6v3+CBJZIVHNp9MCiGc43CkQi9jMi3cjgNfOOxpFYpxTwAspiAHIATUtBL+MttcvJZkpjpVLoQ7msy0Umuc0SGa0UFgDGSDZ1NtzDkdj8eloGJKYdSqdDLWVmsEUm3jc7jsCWSCMNlYo6Kxtbepob1qTdvlacVNMz8x8jiwrPZSpibqW5eRwdF4oj04lGnxjcMsvtS4zzvm7icGuMtKLLlMZZHgYF1fNl1PGdJUvOcmxvRd0zbVcTEmLB4kUBCLHsNUpm5b8MjQMAZDAcM8AgVEMXFWdCTAhALGMZw4I8PcQRcLU7AZJYvA9UJQlpOIQQPLBMOw3D8PHaM7huQDzy6ECSOvZNb0glcH0Qdkwi3VYvAHOlFGsLj0HUCBeLws4QyI4CrQk-pyMo2F3Bo3d6IZCx3WMJ84gQtZrFc-10OwLSdOkHC9IEqMhOuETiMTUiF1TGTlTksjdRfMy1lcWE7C4-DTh8viqzNC0jITG0zKoyzxlo1xQlVZidh7ZlHHIsxYWMFKwDS3z+LuQThPDM8QptcLW1khkBzgnNXLsEJElsOxnC4njZHIc5cgYYhkDOahaHoUgmFYKouF4fghGm7I5tQBalvEdbJBkX52i6pNTEsGx7CcVwPG8PwsyWRT1kHJCOM8eqPO41AsJmqBDuOs5cnyQpijKCotpqXaAaBg75sWsBTqYFpLpUa7SNursHro56fEYplN3WJCIVCP0fU07SLtmlGlqoGg6AkTbqh2uosC8+mQcZtHmguhRsZyq9+jx+6HEJ3ZXvmCEN2hEIex8EJXFp7zkaO1GKAhgoihKaRylQSoOdqQRubp4HQdR9HztaK7RdAySJfGx7+xe-rCxWSlaPzaZWWHA4MlSsArf55nVrZ9htrNoQQ7DrWTsF+2RYvYzQud8x8alp6ZY7ZwzCwQtPv7bZPHcoPsHjzWwZ1vI9ehw3YdNhHq4ZxOBbOzHhY6NPcpurPJbdonZZMZ8ohLrYpl2FIEVIPT4E6Q1SgIYgcHQQGced8ZKJiUb+0cVWGWMGEsAcUJNm8W7oS4hpRCgLfxapzdSRiDZvFWIZGOsSjSWMNVWROmcFMLilZH4mH-mfKY4IBymHiBEWYb1oRwVqokJ8TJqpwmSv9aazUwDgIQCpDcBcQRjDhAkDYjE7pOFhN2aEdh-6vnVrpfCBCfBhHsMAgcKldQWG7LZBhWASTsmZOSVyaoGpNQymw2KnCPDjDZNMfhWZcybjVD6BwbIKLjSmoDXm1sloEJmHBZwcQISrEmFEaw39f4nwAZ4OkwDsGVwthrduYMCERHcGo0x2wJqalHmRCaoxHIq08LSNwkjQ411Rp4kkPiEKoTpK+QJP8z6shCOSCiA5JgV15JgAhDlj6FxUuI5SgxX58NnkkIAA */
  createMachine({
    tsTypes: {} as import("./CRUDMachine.typegen").Typegen0,
    schema: {
      context: {} as CRUDContext<T>,
      events: {} as CRUDEvent<T>,
      services: {} as {
        fetchDocs: { data: T[] },
        createDoc: { data: T | T[] }
      }
    },
    context: { docs: [], selectedDoc: undefined, docsMap: new Map<string, T>([]), firstLoad: true },
    id: "crud",
    initial: "loading",
    predictableActionArguments: true,
    preserveActionOrder: true,
    states: {
      failure: {},
      loading: {
        invoke: {
          src: "fetchDocs",
          onDone: [
            {
              target: "idle",
              actions: ["saveFetchedDocs", "createDocsMap", "sendLoadUpdate"],
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
        },
      },
      creatingService: {
        invoke: {
          src: "createDoc",
          onDone: [
            {
              target: "loading",
              actions: ['sendCreateUpdate']
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
              target: "loading",
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
              target: "loading",
            },
          ],
          onError: [
            {
              target: "failure",
            },
          ],
        },
      },
    },
  }, {
    actions: {
      // loading - fetchDocs
      saveFetchedDocs: assign((_, event) => ({ docs: event.data, })),
      createDocsMap: assign((context) => ({ docsMap: docsToDocsMap(context.docs), })),
      sendLoadUpdate: pure((ctx, event) => ctx.firstLoad ? sendParent({ type: 'FROM_CRUD_DOCS_LOADED', article, docs: event.data }) : undefined),
      // markFirstLoad: assign((_) => ({ firstLoad: false })),
      // creatingService - createDoc
      sendCreateUpdate: sendParent((_, event) => ({ type: 'FROM_CRUD_DOCS_CREATED', article, docs: event.data })),
    },
    services: {
      createDoc: (_, event: CRUDEvent<T>) => {
        if (event.type === 'CREATE') return repo.insert(event.doc);
        return Promise.resolve([]);
      },
      fetchDocs: () => repo.find({}),
      updateDoc: (_, event: CRUDEvent<T>) => {
        if (event.type === 'UPDATE') return repo.update(event._id ?? '', event.doc);
        return Promise.resolve();
      },
      deleteDoc: (_, event: CRUDEvent<T>) => {
        if (event.type === 'DELETE') return repo.delete(event._id ?? '');
        return Promise.resolve();
      },
    },
    guards: {},
  })
);

export const createCRUDMachine = <T extends { _id: string }>(repo: string | Repo<T>, local: 'local' | 'remote', article = 'string') => {
  if (typeof repo !== 'string') {
    return _createCRUDMachine<T>(repo, article);
  }
  if (local === 'local') {
    const Collection = new Repository<T>(repo);
    return _createCRUDMachine<T>(Collection, repo);
  }
  const Collection = new RemoteRepository<T>(repo);
  return _createCRUDMachine<T>(Collection, repo);
};

export type CRUDStateMachine = typeof _createCRUDMachine;

export default createCRUDMachine;
