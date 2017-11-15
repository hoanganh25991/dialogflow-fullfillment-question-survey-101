import { readFromFirebase } from "../firebase/readFromFirebase"
import { mainBranch, questionBranch } from "./config.json"
const _ = console.log

export const getQuestion = async number => {
  const where = { key: "number", value: number }
  return await readFromFirebase(mainBranch, questionBranch, where)
}
