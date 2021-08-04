const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

const crawler = require('./crawler');
const wakeUpDynp = require('./wakeUpDyno');

const URL = 'https://crawler-ca-number.herokuapp.com/';

(async () => await crawler())();

app.get('/', (req, res) => {
    res.send('Hello my friend !')
})

app.get('/ca', async (req, res) => {
    const data = await crawler();

    res.jsonp({ data })
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
    wakeUpDynp(URL, 25);
})