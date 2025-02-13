# supernote-crossword
Downloads tomorrow's crosswords into a designated Dropbox folder.

## Instructions:
1. Fork
2. Setup secrets:
    1. Set DROPBOX_APP_KEY, DROPBOX_APP_SECRET, and DROPBOX_REFRESH_TOKEN based on the [instructions](https://www.nathanbuchar.com/how-to-automatically-upload-daily-nyt-crossword-dropbox-2023#step-2%3A-generate-a-dropbox-refresh-token).
    2. Set NYT_COOKIE by using DevTools to read all cookies from a logged in browser ([document.cookie](https://www.nathanbuchar.com/how-to-automatically-upload-daily-nyt-crossword-dropbox-2023#step-3%3A-obtain-your-nyt-cookie) is not sufficient as some cookies are [HttpOnly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#httponly)).
    3. Set DROPBOX_NYTC_PATH and DROPBOX_WSJC_PATH based on your own preferences.
3. Profit!

## Credit:
Adapted from https://nathanbuchar.com/automatically-uploading-the-nyt-crossword-supernote/

## Status:
[![cron](https://github.com/arichiv/supernote-crossword/actions/workflows/cron.yml/badge.svg)](https://github.com/arichiv/supernote-crossword/actions/workflows/cron.yml)
