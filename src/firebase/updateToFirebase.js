const admin = require("firebase-admin")
const { serviceAccount, databaseURL } = require("./firebase.config.json")
export const app = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  },
  "updateToFirebase"
)
export const db = app.database()

const updateObjX = (getState, describe) => (mainBranch, objXBranch, objXIndexKey = "id") => async objX => {
  // Find if post exist
  const { [objXIndexKey]: id } = objX
  const refToObjXBranch = db.ref(`${mainBranch}/${objXBranch}`)
  const sameObjX = await new Promise(resolve => {
    refToObjXBranch
      .orderByChild(objXIndexKey)
      .equalTo(id)
      .limitToFirst(1)
      .once("value", function(snapshot) {
        resolve(snapshot.val())
      })
  })

  const objXKey = sameObjX ? Object.keys(sameObjX)[0] : refToObjXBranch.push().key
  describe({ type: "LOG", msg: `Saving store...` })
  describe({ type: "LOG", msg: `ObjX ${objXIndexKey} : ${id}` })
  describe({ type: "LOG", msg: `ObjX key: ${objXKey}` })
  await db.ref(`${mainBranch}/${objXBranch}/${objXKey}`).update(objX)
}

/**
 * Save array of objectX to firebase
 * @param getState
 * @param describe
 */
const updateManyObjXs = (getState, describe) => (mainBranch, objXBranch, objXIndexKey) => objXs => {
  return objXs.reduce(async (carry, objX) => {
    await carry
    return updateObjX(getState, describe)(mainBranch, objXBranch, objXIndexKey)(objX)
  }, Promise.resolve())
}

export default updateManyObjXs
