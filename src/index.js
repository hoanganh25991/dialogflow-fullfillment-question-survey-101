import { apiAnswersSession, apiGetPaySummary, apiNextQuestion, apiUpdateAnswerSession } from "./api/index"
import uuidv1 from "uuid/v1"

const _ = console.log
const ASK_QUESTION_CXT = "ask-question"
const SESSION_CXT = "session-cxt"
const stopWords = ["cancel", "skip", "end", "esc"]

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
  const processingAns = answers.filter(answer => typeof answer.answerTxt === "undefined")[0]
  if (!processingAns) {
    _("Cant find last unanswered question")
    return
  }

  const { answers: quesAnsArr } = processingAns

  const matchedAns = quesAnsArr.filter(ans => ans.text === userAns)[0]

  if (!matchedAns) {
    _("Cant find matchedAns in question, quesAnsArr, userAns", quesAnsArr, userAns)
    return
  }

  // Update answer text
  processingAns.answerTxt = userAns
  Object.assign(processingAns, matchedAns)
  delete processingAns.text
}
const addNewQuesToAnsSession = (answerSession, question) => {
  const { answers } = answerSession
  if (!question) {
    _("Not add, question null")
    return
  }
  const newAnswer = {
    ...question,
    questionId: question._id,
    questionTxt: question.text
  }

  delete newAnswer._id
  delete newAnswer.text

  answers.push(newAnswer)
}

const resAskQuestion = async (question, sessionId) => {
  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`
  const { summary } = await apiGetPaySummary(sessionId)
  const messages = [
    {
      platform: "facebook",
      speech: `Estimate summary: ${summary}`,
      type: 0
    },
    {
      platform: "facebook",
      replies: answers.map(ans => ans.text),
      title: questionStr,
      type: 2
    }
  ]
  return {
    contextOut: [
      { name: ASK_QUESTION_CXT, lifespan: 1 },
      { name: SESSION_CXT, lifespan: 2, parameters: { sessionId } }
    ],
    speech: defaultSpeech,
    messages
  }
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

const stopConversation = (req, resObj) => {
  const userAns = req.body.result.resolvedQuery
  if (!stopWords.includes(userAns)) return resObj

  return {
    speech: "Bye bye.",
    contextOut: []
  }
}

export const askQuestion = async (req, res) => {
  const askQuestionContext = req.body.result.contexts.filter(context => context.name === SESSION_CXT)[0]
  _("askQuestionContext, contexts", askQuestionContext, req.body.result.contexts)
  const sessionId = (askQuestionContext && askQuestionContext.parameters.sessionId) || uuidv1()
  // const sessionId = req.body.sessionId
  const answerSession = (await apiAnswersSession(sessionId)) || { sessionId, answers: [] }
  const question = debugQuestion(req, await getNextQuestion(answerSession))

  // Update user ans for last question
  const userAns = req.body.result.resolvedQuery
  updateUserAnsForLastQues(answerSession, userAns)
  addNewQuesToAnsSession(answerSession, question)
  await apiUpdateAnswerSession(answerSession)

  // Res
  const whRes = question ? await resAskQuestion(question, sessionId) : await resSummary(sessionId)
  const resObj = stopConversation(req, debugResObj(req, whRes))

  res.setHeader("Content-Type", "application/json")
  res.send(JSON.stringify(resObj))
}
