import updateToFirebase, { db, app as updateApp } from "./updateToFirebase"
import { readFromFirebase, app as readApp } from "./readFromFirebase"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const getLog = () => {
    const { logState } = store.getState()
    return logState
  }
  const _updateToFirebase = updateToFirebase(null, store.dispatch)
  const _readFromFirebase = readFromFirebase(null, store.dispatch)

  LogToConsole(getLog, store)

  const TEST_CASE = `Read from firebase`
  const _ = console.log
  const passLog = (pass, testCase) => {
    const passStr = pass ? "PASS" : "FAIL"
    _(`\x1b[42m[${passStr}]\x1b[0m ${testCase}`)
  }
  const val = Object.values

  try {
    const mainBranch = "tmp"
    const objXBranch = "updateToFirebase"
    const objXIndexKey = "title"

    // Clean up before start
    await db.ref(`${mainBranch}/${objXBranch}`).remove()

    const objXTitle = new Date().getTime()
    const objXs = [{ title: objXTitle, content: "This is the test obj" }]
    await _updateToFirebase(mainBranch, objXBranch, objXIndexKey)(objXs)

    const objXWithKey = await _readFromFirebase(mainBranch, objXBranch)

    const pass = val(objXWithKey)[0].title === objXTitle
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
