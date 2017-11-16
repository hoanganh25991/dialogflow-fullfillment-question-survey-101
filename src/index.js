import { apiAnswersSession, apiGetPaySummary, apiNextQuestion, apiUpdateAnswerSession } from "./api/index"

const _ = console.log

const getNextQuestion = async answerSession => {
  // Find user answer in history
  const { answers } = answerSession
  const ansHasMaxOrder = answers.sort((a, b) => a.order < b.order)[0]
  const currOrder = ansHasMaxOrder ? ansHasMaxOrder.order : 1
  const questionIds = answers.map(answer => answer.questionId)

  _("currOrder, questionIds", currOrder, questionIds)

  return await apiNextQuestion({ order: currOrder, questionIds })
}
const updateUserAnsForLastQues = (answerSession, userAns) => {
  const { answers } = answerSession
  const unAnsQues = answers.filter(answer => typeof answer.answerTxt === "undefined")[0]
  if (!unAnsQues) {
    _("Cant find last unanswered question")
    return
  }

  // Update answer text
  unAnsQues.answerTxt = userAns
}
const addNewQuesToAnsSession = (answerSession, question) => {
  const { answers } = answerSession
  if (!question) {
    _("Not add, question null")
    return
  }
  const newAnswer = {
    questionId: question._id,
    order: question.order,
    questionTxt: question.text,
    pay: 999
  }
  answers.push(newAnswer)
}
const resSummary = async sessionId => {
  // Should jump to summary
  const { summary, ratio } = await apiGetPaySummary(sessionId)
  const defaultSpeech = `Summary ${summary} to ${summary * ratio}`

  return {
    contextOut: [{ name: "summary", lifespan: 1, parameters: {} }],
    speech: defaultSpeech
  }
}
const resAskQuestion = question => {
  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`
  const messages = [
    {
      platform: "facebook",
      replies: answers.map(ans => ans.text),
      title: questionStr,
      type: 2
    }
  ]
  return {
    contextOut: [{ name: "ask-question", lifespan: 1, parameters: {} }],
    speech: defaultSpeech,
    messages
  }
}
const debugQuestion = (req, question) => {
  if (req.body.result.resolvedQuery !== "end") return question
  // Actually, question get null when user finished them
  return null
}
const debugResObj = (req, resObj) => {
  if (req.body.result.resolvedQuery !== "debug") return resObj

  return {
    speech: JSON.stringify(req.body),
    contextOut: [{ name: "summary", lifespan: 1, parameters: {} }]
  }
}

export const askQuestion = async (req, res) => {
  const sessionId = req.body.sessionId
  const answerSession = (await apiAnswersSession(sessionId)) || { sessionId, answers: [] }
  const question = debugQuestion(req, await getNextQuestion(answerSession))

  // Update user ans for last question
  updateUserAnsForLastQues(answerSession, req.body.result.resolvedQuery)
  addNewQuesToAnsSession(answerSession, question)
  await apiUpdateAnswerSession(answerSession)

  // Res
  const whRes = question ? resAskQuestion(question) : await resSummary(sessionId)
  const resObj = debugResObj(req, whRes)

  res.setHeader("Content-Type", "application/json")
  res.send(JSON.stringify(resObj))
}
