const dropbox = require('dropbox');
const https = require('https');
const moment = require('moment');
const path = require('path');
const process = require('process');

const dbx = new dropbox.Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
});

function getNYTCrossword(date) {
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
          req.end();
          reject(err);
        });
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        res.on('end', () => {
          resolve(Buffer.concat(data));
        });
      } else {
        req.end();
        reject(res.statusCode);
      }
    });
    req.on('error', (err) => {
      req.end();
      reject(err);
    });
  });
}

async function main() {
  const date = new Date((new Date()).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log(`Checking today's crossword.`);
  try {
    getNYTCrossword(date);
  } catch (error) {
    console.log(`NYT_COOKIE has expired. Error: ${error}`);
    process.exit(1);
  }
  console.log(`Downloading tomorrow's crossword.`);
  date.setDate(date.getDate() + 1);
  data = None;
  try {
    data = getNYTCrossword(date);
  } catch (error) {
    console.log(`Tomorrow's crossword is not yet released`);
    return;
  }
  console.log(`Checking if file exists.`);
  console.log(`Uploading file.`);
  try {
    await dbx.filesUpload({
      path: path.join(process.env.SUPERNOTE_UPLOAD_PATH, `${d.format('YYYY-MM-DD-ddd')}-crossword.pdf`),
      contents: data,
    });
    console.log(`Successfully uploaded ${response.result.content_hash}.`);
    return;
  } catch (error) {
    console.log(`Error: ${err}`);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
