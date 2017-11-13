const admin = require("firebase-admin")
const { serviceAccount, databaseURL } = require("./firebase.config.json")
export const app = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  },
  "readFromFirebase"
)
export const db = app.database()

export const readFromFirebase = (getState, describe) => async (mainBranch, objXBranch, where = null) => {
  // Find if post exist
  const refToObjXBranch = db.ref(`${mainBranch}/${objXBranch}`)

  if (where) {
    const { key, value } = where
    describe({ type: "LOG", key, value })

    refToObjXBranch
      .orderByChild(key)
      .equalTo(value)
      .limitToFirst(1)
  }

  return new Promise(resolve => {
    refToObjXBranch.once("value", snapshot => {
      resolve(snapshot.val())
    })
  })
}
