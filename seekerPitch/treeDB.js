import { Dexie } from 'https://unpkg.com/dexie@3.0.3/dist/dexie.mjs'

export function startDataBase( name='seekerTiles2', count = 20) {
    const description = {}
    const db = new Dexie(name)
    for (let i = 0; i < count; i++) {
        const name = `z${i}`
        description[name] = '++id, cameraID, time'
    }

    db.version(1).stores(description)
    db.open()
    return db
}
