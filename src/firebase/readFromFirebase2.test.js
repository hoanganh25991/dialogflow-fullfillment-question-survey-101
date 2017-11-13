import updateToFirebase, { db, app as updateApp } from "./updateToFirebase"
import { readFromFirebase, app as readApp } from "./readFromFirebase"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"

// Utils
const _ = console.log
const passLog = (pass, testCase) =>
  pass ? _(`\x1b[42m[PASS]\x1b[0m ${testCase}`) : _(`\x1b[41m[FAIL]\x1b[0m ${testCase}`)
const val = Object.values
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const getLog = () => {
    const { logState } = store.getState()
    return logState
  }
  const _updateToFirebase = updateToFirebase(null, store.dispatch)
  const _readFromFirebase = readFromFirebase(null, store.dispatch)

  LogToConsole(getLog, store)

  const TEST_CASE = `Read firebase with where`

  try {
    const mainBranch = "tmp"
    const objXBranch = "updateToFirebase"
    const objXIndexKey = "number"

    // Clean up before start
    await db.ref(`${mainBranch}/${objXBranch}`).remove()

    const objXs = [{ content: "number5", number: 5 }, { content: "number6", number: 6 }]
    await _updateToFirebase(mainBranch, objXBranch, objXIndexKey)(objXs)

    const where = { key: "number", value: 5 }
    const objXWithKey = await _readFromFirebase(mainBranch, objXBranch, where)

    const pass = val(objXWithKey)[0].content === "number5"
    return pass ? passLog(true, TEST_CASE) : passLog(false, TEST_CASE)
  } catch (err) {
    _(err)
    return passLog(false, TEST_CASE)
  } finally {
    // Clean up
    await updateApp.delete()
    await readApp.delete()
  }
})()
