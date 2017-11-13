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

export const readFromFirebase = (getState, describe) => async (mainBranch, objXBranch) => {
  // Find if post exist
  const refToObjXBranch = db.ref(`${mainBranch}/${objXBranch}`)
  return new Promise(resolve => {
    refToObjXBranch.once("value", snapshot => {
      resolve(snapshot.val())
    })
  })
}
