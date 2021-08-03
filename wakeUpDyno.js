const fetch = require("node-fetch");
const crawler = require('./crawler');

const wakeUpDyno = (url, interval) => {
    try {
        const milliseconds = interval * 60000;

        // console.log('Time', new Date().getMinutes())

        setTimeout(() => {
            // console.log('Time', new Date().getMinutes())

            crawler();

            fetch(url);

            wakeUpDyno(url, interval);
        }, milliseconds);


    } catch (error) {
        console.log(error);
    }
};

module.exports = wakeUpDyno;