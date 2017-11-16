import {apiAnswersSession, apiGetPaySummary, apiNextQuestion} from "./api/index";
const _ = console.log



/**
 * Get next question to ask
 * @param sessionId
 * @returns {Promise.<*>}
 */
const getQuestion = async sessionId => {
  // Find user answer in history
  const answersSession = await apiAnswersSession(sessionId)
  const ansHasMaxOrder = answersSession && answersSession.sort((a, b) => a.order < b.order)[0]
  const currOrder      = ansHasMaxOrder ? ansHasMaxOrder.order : 1
  const questionIds    = answersSession ? answersSession.map(answer => answer.questionId) : []

  _("currOrder, questionIds", currOrder, questionIds)

  return await apiNextQuestion({ order: currOrder, questionIds })
}




/**
 * All questions answered, give use brief summary
 * @param sessionId
 * @returns {Promise.<{contextOut: [null], speech: string}>}
 */
const resSummary = async sessionId => {
  // Should jump to summary
  const { pay: summary, ratio } = await apiGetPaySummary(sessionId)
  const defaultSpeech           = `Go to summary ${summary} to ${summary * ratio}`

  return {
    contextOut: [{ name: "summary", lifespan: 1, parameters: {} }],
    speech: defaultSpeech
  }
}



/**
 * Build res to ask question
 * @param question
 * @returns {{contextOut: [null], speech: string}}
 */
const resAskQuestion = question => {
  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`
  return {
    contextOut: [{ name: "ask-question", lifespan: 1, parameters: {} }],
    speech: defaultSpeech
  }
}



/**
 * Debug question
 * @param req
 * @param question
 * @returns {*}
 */
const debugQuestion = (req, question)=>{
  if (req.body.result.resolvedQuery !== "end") return question
  // Actually, question get null when user finished them
  return null
}



/**
 * Debug webhook response obj
 * @param req
 * @param resObj
 * @returns {*}
 */
const debugResObj = (req, resObj) => {
  if (req.body.result.resolvedQuery !== "debug") return resObj

  return {
    speech: JSON.stringify(req.body),
    contextOut: [{ name: "summary", lifespan: 1, parameters: {} }]
  }
}


/**
 * Get user answer, decide ask next question or summary
 * @param req
 * @param res
 */
export const askQuestion = (req, res) => {
  res.setHeader("Content-Type", "application/json")

  const sessionId = req.body.sessionId
  let question    = getQuestion(sessionId)
  question        = debugQuestion(req, question)

  // Debug by sending null on nextQuestion
  const whRes  = question ? resAskQuestion(question) : resSummary(sessionId)
  const resObj = debugResObj(req, whRes)

  res.send(JSON.stringify(resObj))
}
