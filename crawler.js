const puppeteer = require('puppeteer');
const fs = require('fs');

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

        const tableData = Array.from(rows).map(item => {
            const value = item.textContent.split("\n\t\t\t\t\t\t");
            return {
                province: value[1].replace(/(\r\n|\n|\r\n|\t)/gm, ""),
                totalCa: value[2].replace(/(\r\n|\n|\r\n|\t)/gm, ""),
                todayCa: value[3].replace(/(\r\n|\n|\r\n|\t)/gm, ""),
                dies: value[4].replace(/(\r\n|\n|\r\n|\t)/gm, ""),
            }
        });

        const dataRow1 = row1.split('\t\t\t\t').filter(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, "") !== '').map(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, ""));
        const dataRow2 = row2.split('\t\t\t\t').filter(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, "") !== '').map(item => item.replace(/(\r\n|\n|\r\n|\t)/gm, ""));

        return {
            tableData,
            totalCa: {
                vi: {
                    title: dataRow1[0],
                    treatment: dataRow1[1],
                    beingTreated: dataRow1[2],
                    die: dataRow1[4],
                    cured: dataRow1[3],
                },
                world: {
                    title: dataRow2[0],
                    treatment: dataRow2[1],
                    beingTreated: dataRow2[2],
                    die: dataRow2[4],
                    cured: dataRow1[3],
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