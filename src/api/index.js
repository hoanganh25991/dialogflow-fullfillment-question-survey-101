import axios from "axios"
import config from "config.json"

// Api type const
const GET_ALL_QUESTIONS = "GET_ALL_QUESTIONS"
const FIND_NEXT_QUESTION = "FIND_NEXT_QUESTION"
const IMPORT_QUESTIONS = "IMPORT_QUESTIONS"

const GET_ALL_ANSWERS = "GET_ALL_ANSWERS"
const FIND_ANSWER = "FIND_ANSWER"
const UPDATE_ANSWER = "UPDATE_ANSWER"
const SUMMARY_ANSWER = "SUMMARY_ANSWER"

const _ = console.log
axios.defaults.timeout = 2000
const { endpoint, questionApi, answerApi } = config

export const apiFindAns = async sessionId => {
  const res = await axios.post(`${endpoint}/${answerApi}`, { sessionId, type: FIND_ANSWER })
  const { answer } = res.data
  return answer
}

export const apiGetSummary = async sessionId => {
  const res = await axios.post(`${endpoint}/${answerApi}`, { sessionId, type: SUMMARY_ANSWER })
  const { summary, ratio } = res.data
  return { summary, ratio }
}

export const apiFindNextQues = async ({ order, questionIds }) => {
  const res = await axios.post(`${endpoint}/${questionApi}`, { order, questionIds, type: FIND_NEXT_QUESTION })
  const { question } = res.data
  return question
}

export const apiUpdateAns = async answerSession => {
  await axios.post(`${endpoint}/${answerApi}`, { ...answerSession, type: UPDATE_ANSWER })
}
