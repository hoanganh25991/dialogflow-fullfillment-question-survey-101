import { apiFindAns, apiGetSummary, apiFindNextQues, apiUpdateAns } from "./api/index"
import uuidv1 from "uuid/v1"

const _ = console.log
const ASK_QUESTION_CXT = "ask-question"
const SESSION_CXT = "session-cxt"
const DEBUG_CXT = "debug-cxt"
const START_SURVEY_CXT = "start-survey"
const stopWords = ["cancel", "skip", "end", "esc"]

const getNextQues = async (ansSession, _lastQuestion) => {
  // Find user answer in history
  const { answers } = ansSession
  const lastQuestion = _lastQuestion || {}
  const { order = 1, _id = null } = lastQuestion
  const questionIds = answers.map(answer => answer.questionId)
  if (_id) questionIds.push(_id)

  _("[getNextQues] lastQuestion, ansSession, currOrder, questionIds", lastQuestion, ansSession, order, questionIds)

  return await apiFindNextQues({ order, questionIds })
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
  if (!question) {
    _("[resAskQues] no question found, res summary")
    return await resSummary(sessionId)
  }

  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`

  const summaryObj = await apiGetSummary(sessionId)

  _("summaryObj", summaryObj)

  const { summary } = summaryObj

  const messages = [
    {
      speech: `Estimate summary: ${summary}`,
      type: 0
    },
    {
      replies: answers.map(ans => ans.text),
      title: questionStr,
      type: 2
    }
  ]

  // Custom payload for each platform
  // Facebook/Google+/Twitter...
  const data = {
    facebook: [
      {
        text: `Estimate summary: ${summary}`
      },
      {
        text: questionStr,
        quick_replies: answers.map(ans => ({
          content_type: "text",
          title: ans.text,
          payload: ans.text,
          image_url: ans.img_url
        }))
      }
    ]
  }
  return {
    contextOut: [
      { name: ASK_QUESTION_CXT, lifespan: 1 },
      { name: SESSION_CXT, lifespan: 1, parameters: { sessionId, lastQuestion: question } }
    ],
    speech: defaultSpeech,
    messages,
    data
  }
}
const resSummary = async sessionId => {
  // Should jump to summary
  const { summary, ratio } = await apiGetSummary(sessionId)
  const defaultSpeech = `Summary ${summary} to ${summary * ratio}`

  const messages = [
    {
      speech: `Based on what you have described, you should budget about S$ ${summary} to S$ ${summary *
        ratio} for your project.`,
      type: 0
    },
    {
      speech: `Please note that this is a rough estimate only, and excludes other costs such as hosting, maintenance and 3rd party costs.`,
      type: 0
    },
    {
      speech: `Arrange a free consultation with our human staff for a more accurate quote today!`,
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
  return userAns === "debug" ? { ...resObj, contextOut: [{ name: DEBUG_CXT, lifespan: 100, parameters: {} }] } : resObj
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
  res.setHeader("Content-Type", "application/json")

  const { contexts } = req.body.result
  const sessionCxt = contexts.filter(context => context.name === SESSION_CXT)[0]
  const startSurveyCxt = contexts.filter(context => context.name === START_SURVEY_CXT)[0]
  const mergedSession = startSurveyCxt ? startSurveyCxt : sessionCxt || {}

  const { parameters = {} } = mergedSession
  const { sessionId = uuidv1(), lastQuestion = null } = parameters

  _("sessionCxt, contexts", sessionCxt, req.body.result.contexts)

  try {
    const ansSession = (await apiFindAns(sessionId)) || { sessionId, answers: [] }
    const question = debugQues(req, await getNextQues(ansSession, lastQuestion))

    // Update user ans for last question
    const { resolvedQuery: userAns } = req.body.result
    addUserAns(ansSession, lastQuestion, userAns)
    // Heavy task
    await apiUpdateAns(ansSession)

    // Response obj
    const whRes = await resAskQues(question, sessionId)
    const resObj = stopConversation(req, debugResObj(req, whRes))

    res.send(JSON.stringify(resObj))
  } catch (err) {
    const debug = contexts.filter(context => context.name === DEBUG_CXT)[0]
    const speech = debug
      ? `[ERR]: ${JSON.stringify(err)}`
      : "Sorry, some errors happen, i cant get right response for you"
    res.send(JSON.stringify({ speech }))
  }
}
