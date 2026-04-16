const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
  ['Founder: Ahmetenesssssss', 'Creator: Ahmetenesssssss'],
  ['Google DeepMind\\\'in Gemini API ile güclendirilmiş Tam Ajantik Terminal AI', 'Full Agentic Terminal AI powered by Google DeepMind\\\'s Gemini API'],
  ['Dosya Yönetimi', 'File Management'],
  ['Terminal Kontrolü', 'Terminal Control'],
  ['Tam Otomasyon', 'Full Automation'],
  ['Oto.çalıştırma: ', 'Auto-run: '],
  ['AÇIK', 'ON'],
  ['KAPALI', 'OFF'],
  ['(/autoexec ile değiştir)', '(/autoexec to toggle)'],
  ['komutlar', 'commands'],
  ['model model', 'model model'],
  ['klasör', 'folder'],
  ['oto.çalıştırma:', 'auto-run:'],
  ['Kritik hata:', 'Critical error:'],
  ['Gemini dusunuyor...', 'Gemini is thinking...'],
  ['Gorusmek uzere!', 'See you later!'],
  ['Gemini Code sonlandirildi.', 'Gemini Code terminated.'],
  ['Ipucu: /model ile farkli bir model deneyin veya birkac dakika bekleyin.', 'Hint: try a different model with /model or wait a minute.']
];

replacements.forEach(([tr, en]) => {
  content = content.split(tr).join(en);
});

fs.writeFileSync(targetFile, content);
console.log('Language fully patched to English. Founder -> Creator.');
