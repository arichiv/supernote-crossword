const dropbox = require('dropbox');
const https = require('https');
const moment = require('moment');
const path = require('path');
const process = require('process');

const dbx = new dropbox.Dropbox({
  clientId: process.env.DROPBOX_APP_KEY,
  clientSecret: process.env.DROPBOX_APP_SECRET,
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
});

function getNYTC(date) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      protocol: 'https:',
      host: 'www.nytimes.com',
      path: `/svc/crosswords/v2/puzzle/print/${moment(date).format('MMMDDYY')}.pdf`,
      method: 'GET',
      headers: {
        Referer: 'https://www.nytimes.com/crosswords/archive/daily',
        Cookie: process.env.NYT_COOKIE,
      },
    }, (res) => {
      if (res.statusCode === 200) {
        const data = [];
        res.on('error', (err) => {
          reject(err);
        });
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        res.on('end', () => {
          resolve(Buffer.concat(data));
        });
      } else {
        reject(res.statusCode);
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}

async function nytc(date) {
  console.log(`Checking ${moment(date).format('YYYY-MM-DD')}'s crossword.`);
  try {
    await getNYTC(date);
    console.log(`Successfully checked ${moment(date).format('YYYY-MM-DD')}'s crossword.`);
  } catch (error) {
    console.log(`NYT_COOKIE likely expired. Error: ${error}`);
    process.exit(1);
  }
  date.setDate(date.getDate() + 1);
  console.log(`Downloading ${moment(date).format('YYYY-MM-DD')}'s crossword.`);
  data = undefined;
  try {
    data = await getNYTC(date);
    console.log(`Successfully downloaded ${moment(date).format('YYYY-MM-DD')}'s crossword.`);
  } catch (error) {
    console.log(`${moment(date).format('YYYY-MM-DD')}'s crossword is not yet released.`);
    return;
  }
  console.log(`Checking if file exists.`);
  try {
    await dbx.filesGetMetadata({
      path: path.join(process.env.DROPBOX_NYTC_PATH, `${moment(date).format('YYYY-MM-DD-ddd')}-crossword.pdf`),
    });
    console.log(`File already uploaded.`);
    return;
  } catch (error) {
    console.log(`File not yet uploaded.`);
  }
  console.log(`Uploading file.`);
  try {
    response = await dbx.filesUpload({
      path: path.join(process.env.DROPBOX_NYTC_PATH, `${moment(date).format('YYYY-MM-DD-ddd')}-crossword.pdf`),
      contents: data,
    });
    console.log(`Successfully uploaded ${response.result.content_hash}.`);
    return;
  } catch (error) {
    console.log(`DROPBOX_ACCESS_TOKEN likely expired. Error: ${error}`);
    process.exit(1);
  }
}

function getWSJC(date) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      protocol: 'https:',
      host: 's.wsj.net',
      path: `/public/resources/documents/${moment(date).format('[XWD]MMDDYYYY')}.pdf`,
      method: 'GET',
    }, (res) => {
      if (res.statusCode === 200) {
        const data = [];
        res.on('error', (err) => {
          reject(err);
        });
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        res.on('end', () => {
          resolve(Buffer.concat(data));
        });
      } else {
        reject(res.statusCode);
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}

async function wsjc(date) {
  date.setDate(date.getDate() + 1);
  console.log(`Downloading ${moment(date).format('YYYY-MM-DD')}'s crossword.`);
  data = undefined;
  try {
    data = await getWSJC(date);
    console.log(`Successfully downloaded ${moment(date).format('YYYY-MM-DD')}'s crossword.`);
  } catch (error) {
    console.log(`${moment(date).format('YYYY-MM-DD')}'s crossword is not yet released.`);
    return;
  }
  console.log(`Checking if file exists.`);
  try {
    await dbx.filesGetMetadata({
      path: path.join(process.env.DROPBOX_WSJC_PATH, `${moment(date).format('YYYY-MM-DD-ddd')}-crossword.pdf`),
    });
    console.log(`File already uploaded.`);
    return;
  } catch (error) {
    console.log(`File not yet uploaded.`);
  }
  console.log(`Uploading file.`);
  try {
    response = await dbx.filesUpload({
      path: path.join(process.env.DROPBOX_WSJC_PATH, `${moment(date).format('YYYY-MM-DD-ddd')}-crossword.pdf`),
      contents: data,
    });
    console.log(`Successfully uploaded ${response.result.content_hash}.`);
    return;
  } catch (error) {
    console.log(`DROPBOX_ACCESS_TOKEN likely expired. Error: ${error}`);
    process.exit(1);
  }
}

async function download(date) {
  console.log(`NYTC Block`);
  await nytc(new Date(date.getTime()));
  console.log(`WSJC Block`);
  await wsjc(new Date(date.getTime()));
}

async function main() {
  const date = new Date((new Date()).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  for (let i = 0; i < 14; i++) {
    await download(date);
    date.setDate(date.getDate() - 1);
  }
}

main().then(() => process.exit(0));
