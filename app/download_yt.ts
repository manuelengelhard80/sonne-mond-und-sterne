import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';

async function run() {
  const url = 'https://youtu.be/pg52OPw7uhw';
  const outputPath = path.join(process.cwd(), 'public', 'tantra2.mp3');
  console.log('Downloading audio from YouTube...');
  const audioStream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
  const fileStream = fs.createWriteStream(outputPath);
  audioStream.pipe(fileStream);
  fileStream.on('finish', () => {
    console.log('Download complete: public/tantra2.mp3');
  });
  fileStream.on('error', (err) => {
    console.error('Download error:', err);
  });
}

run();
