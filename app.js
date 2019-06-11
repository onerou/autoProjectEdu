const express = require('express')
const puppeteerDo = require('./puppeteerDo.js')
const app = express()
app.listen(4050, async () => {
    console.log('Example app listening on port 3000!')
    puppeteerDo()
})