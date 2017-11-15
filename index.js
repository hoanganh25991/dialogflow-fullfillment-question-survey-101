"use strict"
// https://us-central1-glass-turbine-148103.cloudfunctions.net/questionSurvey101
const getAnswersSession = sessionId => [
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

const apiNextQuestion = () => ({
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

const getQuestion = sessionId => {
  // Find user answer in history
  const answersSession = getAnswersSession(sessionId)
  const answerWithHighestOrder = answersSession.sort((a, b) => a.order < b.order)[0]
  const currOrder = answerWithHighestOrder ? answerWithHighestOrder.order : 1
  const questionIds = answersSession.map(answer => answer.questionId)

  console.log(currOrder, questionIds)

  return apiNextQuestion({ order: currOrder + 1, questionIds })
}

exports.askQuestion = (req, res) => {
  res.setHeader("Content-Type", "application/json")
  const sessionId = req.body.sessionId
  let question = getQuestion(sessionId)

  if (req.body.result.resolvedQuery === "end") question = null

  let resObj = {}

  if (!question) {
    // Should jump to summary
    resObj = {
      ...resObj,
      contextOut: [{ name: "Summary", lifeSpan: 1 }],
      speech: "Go to summary"
    }
  } else {
    const { text: questionStr, answers } = question
    const defaultAnswer = answers.reduce((carry, answer) => `${carry}/${answer.text}`, "Next/Previous")
    const defaultSpeech = `${questionStr}\n${defaultAnswer}`
    resObj = { ...resObj, speech: defaultSpeech }
  }

  res.send(JSON.stringify(resObj))
}
