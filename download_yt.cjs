const { Ytdl } = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const ytdl = new Ytdl();
  const url = 'https://youtu.be/pg52OPw7uhw';
  const outputPath = path.join(process.cwd(), 'public', 'tantra2.mp3');
  console.log('Downloading audio with @distube/ytdl-core Ytdl class...');
  try {
    const audioStream = ytdl.download(url, { quality: 'highestaudio' });
    const fileStream = fs.createWriteStream(outputPath);
    audioStream.pipe(fileStream);
    fileStream.on('finish', () => {
      console.log('Download complete: public/tantra2.mp3');
    });
    fileStream.on('error', (err) => {
      console.error('Download stream error:', err);
    });
  } catch (err) {
    console.error('Download catch error:', err);
  }
}

run();
