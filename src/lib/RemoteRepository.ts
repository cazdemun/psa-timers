type PartialWithId<T> = { _id: string } & Partial<T>

export default class RemoteRepository<T> {
  url: string;

  constructor(collection: string) {
    this.url = `http://localhost:9094/api/${collection}`;
  }

  find(query?: Record<string, string>): Promise<T[]> {
    const params = new URLSearchParams(query ?? {}).toString();
    return fetch(`${this.url}?${params}`)
      .then((res) => res.json())
      .then((docs) => docs as T[]);
  }

  insert(newDocs: Omit<T, '_id'> | (Omit<T, '_id'>[])): Promise<T | (T[])> {
    return fetch(`${this.url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDocs),
    })
      .then((res) => res.json())
      .then((docs) => docs as (T | (T[])));
  }

  update(_id: string, update: Partial<T>): Promise<number> {
    return fetch(`${this.url}`, {
      method: 'put',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _id, ...update }),
    })
      .then((res) => res.json())
      .then((numUpdated) => numUpdated as number);
  }

  updateMany(docs: PartialWithId<T>[]): Promise<number> {
    if (docs.length === 0) return Promise.resolve(0);
    return fetch(`${this.url}`, {
      method: 'put',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docs }),
    })
      .then((res) => res.json())
      .then((numUpdated) => numUpdated as number);
  }

  delete(_id: string): Promise<number> {
    return fetch(`${this.url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _id }),
    })
      .then((res) => res.json())
      .then((numRemoved) => numRemoved as number);
  }

  deleteMany(_ids: string[]): Promise<number> {
    return fetch(`${this.url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _ids }),
    })
      .then((res) => res.json())
      .then((numRemoved) => numRemoved as number);
  }
}
