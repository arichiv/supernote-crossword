/**
 * Derived from https://nathanbuchar.com/automatically-uploading-the-nyt-crossword-supernote/
 */

const dropbox = require('dropbox');
const https = require('https');
const moment = require('moment');
const path = require('path');

// Instantiate the Dropbox instance.
//
// Set DROPBOX_ACCESS_TOKEN to an access token that you've
// generated for your Dropbox account.
//
// See https://dropbox.tech/developers/generate-an-access-token-for-your-own-account
const dbx = new dropbox.Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
});

function getNYTCrossword(date) {
  const d = moment(date);

  console.log('Attempting to download crossword...');

  // Get the crossword.
  //
  // Set NYT_COOKIE to the return value of `document.cookie`
  // when logged into your account on nytimes.com. This
  // cookie will eventually expire and need to be set again.
  const req = https.request({
    protocol: 'https:',
    host: 'www.nytimes.com',
    path: `/svc/crosswords/v2/puzzle/print/${d.format('MMMDDYY')}.pdf`,
    method: 'GET',
    headers: {
      Referer: 'https://www.nytimes.com/crosswords/archive/daily',
      Cookie: process.env.NYT_COOKIE,
    },
  }, (res) => {
    if (res.statusCode === 200) {
      const data = [];

      res.on('error', (err) => {
        console.log(err);
      });

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        console.log('Successfully downloaded crossword');

        // The file has successfully downloaded. Upload it
        // to Dropbox.
        //
        // Set SUPERNOTE_UPLOAD_PATH to the path where the
        // PDFs should be uploaded on Dropbox. This should
        // look something like "/Supernote/Document/Crosswords".
        dbx.filesUpload({
          path: path.join(process.env.SUPERNOTE_UPLOAD_PATH, `${d.format('YYYYMMDD_ddd')}-crossword.pdf`),
          contents: Buffer.concat(data),
        }).then((response) => {
          console.log('Successfully uploaded crossword');
          console.log(`Content hash: ${response.result.content_hash}`);
        }).catch((err) => {
          console.log('Error writing to dropbox');
          console.log(err);
        });
      });
    } else {
      console.log(`Could not get crossword. Status code: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    console.log(err);
  });

  req.end();
}

function getTomorrowsNYTCrossword() {
  const today = new Date();
  const todayNYTime = today.toLocaleString('en-US', { timeZone: 'America/New_York' });

  const tomorrow = new Date(todayNYTime);
  tomorrow.setDate(tomorrow.getDate() + 1);

  getNYTCrossword(tomorrow);
}

getTomorrowsNYTCrossword();
