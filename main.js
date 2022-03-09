const dropbox = require('dropbox');
const https = require('https');
const moment = require('moment');
const path = require('path');
const process = require('process');

const dbx = new dropbox.Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
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

async function nytc() {
  const date = new Date((new Date()).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log(`Checking today's crossword.`);
  try {
    await getNYTC(date);
    console.log(`Successfully checked today's crossword.`);
  } catch (error) {
    console.log(`NYT_COOKIE likely expired. Error: ${error}`);
    process.exit(1);
  }
  console.log(`Downloading tomorrow's crossword.`);
  date.setDate(date.getDate() + 1);
  data = undefined;
  try {
    data = await getNYTC(date);
    console.log(`Successfully downloaded tomorrow's crossword.`);
  } catch (error) {
    console.log(`Tomorrow's crossword is not yet released.`);
    return;
  }
  console.log(`Checking if file exists.`);
  try {
    await dbx.filesGetMetadata({
      path: path.join(process.env.DROPBOX_NYTC_PATH, `${moment(date).format('YYYY-MM-DD-ddd')}-nytc.pdf`),
    });
    console.log(`File already uploaded.`);
    return;
  } catch (error) {
    console.log(`File not yet uploaded.`);
  }
  console.log(`Uploading file.`);
  try {
    response = await dbx.filesUpload({
      path: path.join(process.env.DROPBOX_NYTC_PATH, `${moment(date).format('YYYY-MM-DD-ddd')}-nytc.pdf`),
      contents: data,
    });
    console.log(`Successfully uploaded ${response.result.content_hash}.`);
    return;
  } catch (error) {
    console.log(`DROPBOX_ACCESS_TOKEN likely expired. Error: ${error}`);
    process.exit(1);
  }
}

async function main() {
  await nytc();
}

main().then(() => process.exit(0));
