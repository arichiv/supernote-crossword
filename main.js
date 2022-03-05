const dropbox = require('dropbox');
const https = require('https');
const moment = require('moment');
const path = require('path');
const process = require('process');

const dbx = new dropbox.Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
});

async function getNYTCrossword(date) {
  const d = moment(date);
  console.log('Attempting to download crossword...');
  const res = await https.request({
    protocol: 'https:',
    host: 'www.nytimes.com',
    path: `/svc/crosswords/v2/puzzle/print/${d.format('MMMDDYY')}.pdf`,
    method: 'GET',
    headers: {
      Referer: 'https://www.nytimes.com/crosswords/archive/daily',
      Cookie: process.env.NYT_COOKIE,
    },
  });
  if (res.statusCode === 200) {
    const data = [];
    res.on('error', (err) => {
      console.log(err);
      process.exit(1);
    });
    res.on('data', (chunk) => {
      data.push(chunk);
    });
    res.on('end', () => {
      console.log('Successfully downloaded crossword');
      dbx.filesUpload({
        path: path.join(process.env.SUPERNOTE_UPLOAD_PATH, `${d.format('YYYY-MM-DD-ddd')}-crossword.pdf`),
        contents: Buffer.concat(data),
      }).then((response) => {
        console.log('Successfully uploaded crossword');
        console.log(`Content hash: ${response.result.content_hash}`);
      }).catch((err) => {
        console.log('Error writing to dropbox');
        console.log(err);
        process.exit(1);
      });
    });
  } else {
    console.log(`Could not get crossword. Status code: ${res.statusCode}`);
    // Use status code 0 since it may just be too early to get the crossword.
    process.exit(0);
  }
}

async function getTomorrowsNYTCrossword() {
  const today = new Date();
  const todayNYTime = today.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const tomorrow = new Date(todayNYTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  await getNYTCrossword(tomorrow);
}

getTomorrowsNYTCrossword().then(() => process.exit(0));
