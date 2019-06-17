const express = require('express');
const puppeteerDo = require('./puppeteerDo.js');
const app = express();
app.listen(6666, async () => {
    console.log('Example app listening on port 6666!');
    puppeteerDo();
});