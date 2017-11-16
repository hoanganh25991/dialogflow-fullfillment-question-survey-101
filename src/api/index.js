import axios from "axios"
import config from "config.json"

const _ = console.log
axios.defaults.timeout = 2000
const {endpoint, questionApi, answerApi, summaryApi} = config

export const apiAnswersSession = async sessionId => {
  const res = await axios.post(`${endpoint}/${answerApi}/sessionId`, {sessionId})
  const {answer} = res.data
  return answer
}

export const apiGetPaySummary = async sessionId => {
  const res = await axios.post(`${endpoint}/${summaryApi}/sessionId`, {sessionId})
  const {summary, ratio} = res.data
  return {summary, ratio}
}

export const apiNextQuestion = async ({order, questionIds}) => {
  const res = await axios.post(`${endpoint}/${questionApi}/next`, {order, questionIds})
  const {question} = res.data
  return question
}

export const apiUpdateAnswerSession = async (answerSession) => {
  await axios.put(`${endpoint}/${answerApi}/sessionId`, answerSession)
}