import { apiFindAns, apiGetSummary, apiFindNextQues, apiUpdateAns, apiChoosenPlatforms } from "./api/index"
import uuidv1 from "uuid/v1"

const _ = console.log
const ASK_QUESTION_CXT = "ask-question"
const SESSION_CXT = "session-cxt"
const DEBUG_CXT = "debug-cxt"
const START_SURVEY_CXT = "start-survey"
const stopWords = ["cancel", "skip", "end", "esc"]
const ASK_AGAIN = "ASK_AGAIN"
const ASK_NEXT = "ASK_NEXT"

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
  const next = { type: ASK_NEXT }
  const { answers } = ansSession

  if (!lastQuestion) {
    _("Cant find last unanswered question")
    return next
  }

  const { answers: quesAns } = lastQuestion
  const matchedAns = quesAns.filter(ans => ans.text.toLowerCase().trim() === userAns.toLowerCase().trim())[0]

  if (!matchedAns) {
    _("Cant find matchedAns in question, quesAnsArr, userAns", quesAns, userAns)
    return { type: ASK_AGAIN }
  }

  const newAns = {
    questionId: lastQuestion._id,
    questionTxt: lastQuestion.text,
    ...lastQuestion,
    answerTxt: userAns,
    ...matchedAns
  }

  delete newAns._id
  delete newAns.text
  delete newAns.__v

  answers.push(newAns)

  return next
}

const resAskQues = async (question, sessionId) => {
  if (!question) {
    _("[resAskQues] no question found, res summary")
    return await resSummary(sessionId)
  }

  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`
  // const { summary } = await apiGetSummary(sessionId)
  //
  // _("summary", summary)
  // const sumMsg = `Estimate summary: S$${summary}`

  const messages = [
    // {
    //   speech: sumMsg,
    //   type: 0
    // },
    {
      replies: answers.map(ans => ans.text),
      title: questionStr,
      type: 2
    }
  ]

  // Custom payload for each platform
  // Facebook/Google+/Twitter...
  const choosenPlatforms = await apiChoosenPlatforms(sessionId)

  const data = {
    facebook: [
      // {
      //   text: sumMsg
      // },
      {
        text: questionStr,
        quick_replies: answers
          .filter(ans => {
            // Check if answer match platform condition
            const { platform } = ans
            if (!platform) return true
            // Return if answer matched choosen platforms
            return Object.keys(platform).reduce((carry, key) => carry && choosenPlatforms[key], true)
          })
          .map(ans => ({
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
  // Get user ans session
  const ansSession = await apiFindAns(sessionId)
  const { answers = [] } = ansSession || {}

  // Should jump to summary
  const { summary, ratio } = await apiGetSummary(sessionId)

  _("[resSummary] summary/ratio", summary, ratio)

  const from = summary.toFixed(2)
  const to = (summary * ratio).toFixed(2)
  const defaultSpeech = `Summary ${from} to ${to}`

  const briefSummaryAns = answers.reduce((carry, ans) => {
    carry += ans.title ? `${ans.title}\n` : ""
    return carry
  }, "")

  const messages = [
    {
      speech: briefSummaryAns,
      type: 0
    },
    {
      speech: `Based on what you have described, you should budget about S$${from} to S$${to} for your project.`,
      type: 0
    },
    {
      speech: `Please note that this is a rough estimate only, and excludes other costs such as hosting, maintenance and 3rd party costs.`,
      type: 0
    },
    {
      speech: `Arrange a free consultation with our human staff for a more accurate quote today!`,
      type: 0
    },
    {
      buttons: [
        {
          postback: "https://originallyus.sg/contact/",
          text: "Open Contact Form"
        }
      ],
      imageUrl: "http://originallyus.sg/wp-content/uploads/2016/03/og_black.png",
      subtitle: "Fill up this little form and a human will get back prompto!",
      title: "Contact Form",
      type: 1
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

const sayHello = resObj => {
  const helloMsg = "Ok, let's work out the a ballpark for the app you want to build!"
  const { messages, data: { facebook = [] } } = resObj

  resObj.messages = [{ speech: helloMsg, type: 0 }, ...messages]
  resObj.data.facebook = [{ text: helloMsg }, ...facebook]

  _("[resObjs2]", resObj)

  return resObj
}

export const askQuestion = async (req, res) => {
  res.setHeader("Content-Type", "application/json")

  const { contexts } = req.body.result

  const hasAskQuesCxt = contexts.filter(cxt => cxt.name === ASK_QUESTION_CXT).length > 0

  // This webhook currently only handle
  /// ask-question in context
  if (!hasAskQuesCxt) {
    res.send(JSON.stringify({}))
    return
  }

  const sessionCxt = contexts.filter(context => context.name === SESSION_CXT)[0]
  // const startSurveyCxt = contexts.filter(context => context.name === START_SURVEY_CXT)[0]
  // const mergedSession = startSurveyCxt ? startSurveyCxt : (sessionCxt || {})
  const mergedSession = sessionCxt || {}

  const { parameters = {} } = mergedSession
  const { sessionId = uuidv1(), lastQuestion = null } = parameters

  _("sessionCxt, contexts", sessionCxt, req.body.result.contexts)

  try {
    const ansSession = (await apiFindAns(sessionId)) || { sessionId, answers: [] }
    const question = debugQues(req, await getNextQues(ansSession, lastQuestion))

    // Update user ans for last question
    const { resolvedQuery: userAns } = req.body.result
    const { type } = addUserAns(ansSession, lastQuestion, userAns)

    if (type === ASK_AGAIN) {
      _("[Ask again], lastQuestion", lastQuestion)
      const askMsg = `Sorry, i dont understand your answer. Please say again`

      const resObj = await resAskQues(lastQuestion, sessionId)
      const { messages, data: { facebook = [] } } = resObj

      resObj.messages = [{ speech: askMsg, type: 0 }, ...messages]
      resObj.data.facebook = [{ text: askMsg }, ...facebook]

      _("[resObj]", resObj)

      const resObj2 = stopConversation(req, debugResObj(req, resObj))

      res.send(JSON.stringify(resObj2))
      return
    }
    // Heavy task
    await apiUpdateAns(ansSession)

    // Response obj
    const whRes = await resAskQues(question, sessionId)
    const resObj = stopConversation(req, debugResObj(req, whRes))

    const started = !lastQuestion
    const resObj2 = started ? sayHello(resObj) : resObj
    // const resObj2 = resObj

    res.send(JSON.stringify(resObj2))
  } catch (err) {
    _(err)
    const debug = contexts.filter(context => context.name === DEBUG_CXT)[0]
    const speech = debug ? `[ERR]` : `Sorry, some errors happen, i cant get right response for you`
    res.send(JSON.stringify({ speech }))
  }
}
