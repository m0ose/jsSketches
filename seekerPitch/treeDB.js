import { Dexie } from 'https://unpkg.com/dexie@3.0.3/dist/dexie.mjs'

let dbSingleton

export function getTreeDataBase(name = 'seekerTiles2', count = 20) {
  if (dbSingleton) return dbSingleton
  const db = new Dexie(name)
  const description = {
    fetchCheckList : 'id++, path'
  }
  for (let i = 0; i < count; i++) {
    const name = `z${i}`
    description[name] = '++id, cameraID, time'
  }
  db.version(1).stores(description)
  db.open()
  dbSingleton = db
  return db
}




