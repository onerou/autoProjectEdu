const express = require('express')
const puppeteerDo = require('./puppeteerDo.js')
const CourseKnowledgeDo = require('./CourseKnowledgeDo')
const app = express()
app.listen(6666, async () => {
	console.log('Example app listening on port 6666!')
	puppeteerDo()
	// CourseKnowledgeDo()
})
