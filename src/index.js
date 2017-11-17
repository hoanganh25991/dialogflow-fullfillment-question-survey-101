import { apiFindAns, apiGetSummary, apiFindNextQues, apiUpdateAns } from "./api/index"
import uuidv1 from "uuid/v1"

const _ = console.log
const ASK_QUESTION_CXT = "ask-question"
const SESSION_CXT = "session-cxt"
const stopWords = ["cancel", "skip", "end", "esc"]

const getNextQues = async answerSession => {
  // Find user answer in history
  const { answers } = answerSession
  const ansHasMaxOrder = answers.sort((a, b) => a.order < b.order)[0]
  const currOrder = ansHasMaxOrder ? ansHasMaxOrder.order : 1
  const questionIds = answers.map(answer => answer.questionId)

  _("currOrder, questionIds", currOrder, questionIds)

  return await apiFindNextQues({ order: currOrder, questionIds })
}
const addUserAns = (ansSession, lastQuestion, userAns) => {
  const { answers } = ansSession

  if (!lastQuestion) return _("Cant find last unanswered question")

  const { answers: quesAns } = lastQuestion
  const matchedAns = quesAns.filter(ans => ans.text === userAns)[0]

  if (!matchedAns) return _("Cant find matchedAns in question, quesAnsArr, userAns", quesAns, userAns)

  const newAns = {
    questionId: lastQuestion._id,
    questionTxt: lastQuestion.text,
    order: lastQuestion.order,
    answerTxt: userAns,
    ...matchedAns
  }

  answers.push(newAns)
}

const resAskQues = async (question, sessionId) => {
  if (!question) return await resSummary(sessionId)

  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`

  const summaryObj = await apiGetSummary(sessionId)

  _("summaryObj", summaryObj)

  const { summary } = summaryObj

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
      { name: SESSION_CXT, lifespan: 2, parameters: { sessionId, lastQuestion: question } }
    ],
    speech: defaultSpeech,
    messages
  }
}
const resSummary = async sessionId => {
  // Should jump to summary
  const { summary, ratio } = await apiGetSummary(sessionId)
  const defaultSpeech = `Summary ${summary} to ${summary * ratio}`

  const messages = [
    {
      platform: "facebook",
      speech: `Summary ${summary} to ${summary * ratio}`,
      type: 0
    }
  ]

  return {
    contextOut: [{ name: "summary", lifespan: 1, parameters: {} }],
    speech: defaultSpeech,
    messages
  }
}

const debugQues = (req, question) => {
  const { resolvedQuery: userAns } = req.body.result
  return userAns === "end" ? null : question
}

const debugResObj = (req, resObj) => {
  const { resolvedQuery: userAns } = req.body.result
  return userAns === "debug"
    ? {
        speech: JSON.stringify(req.body),
        contextOut: [{ name: "debug", lifespan: 1, parameters: {} }]
      }
    : resObj
}

const stopConversation = (req, resObj) => {
  const { resolvedQuery: userAns } = req.body.result
  return stopWords.includes(userAns)
    ? {
        speech: "Bye bye.",
        contextOut: []
      }
    : resObj
}

export const askQuestion = async (req, res) => {
  const { contexts } = req.body.result
  const sessionCxt = contexts.filter(context => context.name === SESSION_CXT)[0]

  _("askQuestionContext, contexts", sessionCxt, req.body.result.contexts)

  const { sessionId = uuidv1(), lastQuestion = null } = (sessionCxt && sessionCxt.parameters) || {}
  const ansSession = (await apiFindAns(sessionId)) || { sessionId, answers: [] }
  const question = debugQues(req, await getNextQues(ansSession))

  // Update user ans for last question
  const { resolvedQuery: userAns } = req.body.result
  addUserAns(ansSession, lastQuestion, userAns)

  // Response obj
  const whRes = await resAskQues(question, sessionId)
  const resObj = stopConversation(req, debugResObj(req, whRes))

  res.setHeader("Content-Type", "application/json")
  res.send(JSON.stringify(resObj))

  // Heavy task
  await apiUpdateAns(ansSession)
}
