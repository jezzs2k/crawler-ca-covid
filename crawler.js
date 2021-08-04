const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require("node-fetch");
const moment = require('moment-timezone');

async function extractNews(url) {
    const browser = await puppeteer.launch({
        headless: true,
        waitUntil: 'networkidle2',
        // executablePath: '/usr/bin/google-chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 0 });


    const data = await page.evaluate(() => {
        const content = document.querySelector("section#content");

        const covidNum = content.querySelector("section.container > div > div");

        const table = content.querySelector("section.bg-xam > div > div table#sailorTable");

        const row1 = covidNum.querySelector("div").textContent;
        const row2 = covidNum.querySelector("div > div.row").textContent;

        const rows = table.querySelectorAll('tr');

        const replaceBreakLine = (src) => {
            return src.replace(/(\r\n|\n|\r\n|\t)/gm, "");
        };

        const replaceJustGetNumber = (src) => {
            return src.replace(/[^\d]/g, "");
        };

        const tableData = Array.from(rows).map(item => {
            const value = item.textContent.split("\n\t\t\t\t\t\t");
            return {
                province: replaceBreakLine(value[1]),
                totalCa: replaceBreakLine(value[2]),
                todayCa: replaceBreakLine(value[3]),
                dies: replaceBreakLine(value[4]),
            }
        });



        const dataRow1 = row1.split('\t\t\t\t').filter(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, "") !== '').map(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, ""));
        const dataRow2 = row2.split('\t\t\t\t').filter(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, "") !== '').map(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, ""));

        return {
            tableData,
            totalCa: {
                vi: {
                    title: dataRow1[0],
                    treatment: replaceJustGetNumber(dataRow1[1]),
                    beingTreated: replaceJustGetNumber(dataRow1[2]),
                    die: replaceJustGetNumber(dataRow1[4]),
                    cured: replaceJustGetNumber(dataRow1[3]),
                },
                world: {
                    title: dataRow2[0],
                    treatment: replaceJustGetNumber(dataRow2[1]),
                    beingTreated: replaceJustGetNumber(dataRow2[2]),
                    die: replaceJustGetNumber(dataRow2[4]),
                    cured: replaceJustGetNumber(dataRow1[3]),
                },
            }
        };
    });

    await browser.close();

    return {
        data,
    };
}

const handleCrawlerNews = async () => {
    const data = await extractNews('https://ncov.moh.gov.vn/');

    const now = moment(new Date());
    const nowViTz = now.tz('Asia/Ho_Chi_Minh');

    const hour = nowViTz.hour();
    const minute = nowViTz.minute();

    if (hour === 6 || hour === 10 || hour === 12 || hour === 13 || hour === 16 || hour === 19 || hour === 22 || (hour === 23 && minute === 30)) {
        const caInput = {
            "totalCa": JSON.stringify(JSON.stringify(data.data.totalCa)),
            "tableData": JSON.stringify(JSON.stringify(data.data.tableData)),
        }

        const body = {
            "query": `mutation{createCa(caInput: {totalCa: ${caInput.totalCa}, tableData: ${caInput.tableData}} ){message} }`
        };

        fetch('https://crawl-new-api.herokuapp.com/', {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json())
            .then(json => console.log(json));
    }

    fs.writeFile('infos.json', JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            console.log(`Error writing file: ${err}`);
        } else {
            console.log(`File is written successfully!`);
        }
    });

    return data;
};

module.exports = async () => {
    return await handleCrawlerNews()
}