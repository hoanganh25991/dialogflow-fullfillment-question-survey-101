"use strict"
// https://us-central1-glass-turbine-148103.cloudfunctions.net/questionSurvey101
const apiAnswersSession = sessionId => [
  {
    _id: "xxx",
    questionId: "123456789",
    // Place question info here
    order: 1,
    answer: {
      text: "iOS",
      img_url: "http://by.originally.us/howmuch/images/iphone-300x300.png",
      pay: 0
    }
  },
  {
    _id: "yyy",
    questionId: "987654321",
    order: 2,
    answer: {
      text: "tablet",
      img_url: "http://by.originally.us/howmuch/images/iphone-300x300.png",
      pay: 0
    }
  }
]
const apiNextQuestion = ({ order, questionIds }) => ({
  _id: "123456789",
  order: 5,
  text: "Which platforms do you wish to build for?",
  answers: [
    {
      text: "iOS",
      img_url: "http://by.originally.us/howmuch/images/iphone-300x300.png",
      pay: 10
    },
    {
      text: "Android",
      img_url: "http://by.originally.us/howmuch/images/android-300x300.png",
      pay: 10
    },
    {
      text: "Web app",
      img_url: "http://by.originally.us/howmuch/images/browser-300x300.png",
      pay: 10
    }
  ]
})
const apiGetPaySummary = sessionId => {
  const answersSession = apiAnswersSession(sessionId)

  // Logic compute multiply & pay

  // Fake return to test
  return {
    pay: 1000,
    ratio: 1.35
  }
}
const getQuestion = sessionId => {
  // Find user answer in history
  const answersSession = apiAnswersSession(sessionId)
  const ansHasMaxOrder = answersSession.sort((a, b) => a.order < b.order)[0]
  const currOrder = ansHasMaxOrder ? ansHasMaxOrder.order : 1
  const questionIds = answersSession.map(answer => answer.questionId)

  console.log("currOrder, questionIds", currOrder, questionIds)

  return apiNextQuestion({ order: currOrder, questionIds })
}
const resSummary = sessionId => {
  // Should jump to summary
  const { pay, ratio } = apiGetPaySummary(sessionId)
  const msg = `Go to summary ${pay} to ${pay * ratio}`

  return {
    contextOut: [{ name: "summary", lifespan: 1, parameters: {} }],
    speech: msg
  }
}
const resAskQuestion = question => {
  const { text: questionStr, answers } = question
  const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
  const defaultSpeech = `${questionStr}\n${defaultAnswer}`
  return { contextOut: [{ name: "askQuestion", lifespan: 1, parameters: {} }], speech: defaultSpeech }
}

exports.askQuestion = (req, res) => {
  res.setHeader("Content-Type", "application/json")

  const sessionId = req.body.sessionId
  let question = getQuestion(sessionId)

  // Debug by sending null on nextQuestion
  if (req.body.result.resolvedQuery === "end") question = null

  const custom = question ? resAskQuestion(question) : resSummary(sessionId)
  let resObj = {
    displayText: "FromWebHook",
    source: "FromWebHook",
    ...custom
  }

  if (req.body.result.resolvedQuery === "debug") resObj = { speech: JSON.stringify(req.body) }

  res.send(JSON.stringify(resObj))
}
