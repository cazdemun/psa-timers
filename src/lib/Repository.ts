import Nedb from '@seald-io/nedb';

type PartialWithId<T> = { _id: string } & Partial<T>

export default class Repository<T> {
  db: Nedb;

  constructor(collection: string) {
    this.db = new Nedb({ filename: collection, autoload: true });
  }

  find(query?: Record<string, string>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.find(query ?? {}, (err: any, docs: T[]) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  }

  insert(newDocs: Omit<T, '_id'> | (Omit<T, '_id'>[])): Promise<T | (T[])> {
    return new Promise((resolve, reject) => {
      this.db.insert(newDocs, (err: any, docs) => {
        if (err) reject(err);
        else resolve(docs as unknown as T | (T[]));
      });
    });
  }

  update(_id: string, update: Partial<T>): Promise<number> {
    if (_id === '') return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      this.db.update(
        { _id },
        { $set: { ...update } }, {}, (err: any, numUpdated: number) => {
          if (err) reject(new Error(`Updating document with value: ${_id} - ${err.message}`));
          else resolve(numUpdated);
        },
      );
    });
  }

  updateMany(docs: PartialWithId<T>[]): Promise<number> {
    if (docs.length === 0) return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      Promise.all(docs.map((doc) => this.update(doc._id, doc)))
      .then((nums: number[]) => nums.reduce((acc, x) => acc + x, 0))
      .then(resolve)
      .catch((err) => reject(new Error(`Updating documents with _ids: ${JSON.stringify(docs.map((d) => (d as any)._id))} - ${err.message}`)));
    });
  }

  delete(_id: string): Promise<number> {
    if (_id === '') return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      this.db.remove({ _id }, { multi: true }, (err: any, numRemoved: number) => {
        if (err) reject(new Error(`Deleting document with _id: ${_id} - ${err.message}`));
        else resolve(numRemoved);
      });
    });
  }
  
  deleteMany(_ids: string[]): Promise<number> {
    if (_ids.length === 0) return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      this.db.remove({ _id: { $in: _ids } }, { multi: true }, (err: any, numRemoved: number) => {
        if (err) reject(new Error(`Deleting documents with _ids: ${JSON.stringify(_ids)} - ${err.message}`));
        else resolve(numRemoved);
      });
    });
  }
}
