const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
  [/Google DeepMind'in Gemini API ile güclendirilmiş Tam Ajantik Terminal AI/g, "Full Agentic Terminal AI powered by Google DeepMind's Gemini API"],
  [/Dosya Yönetimi · Terminal Kontrolü · Tam Otomasyon/g, "File Management · Terminal Control · Full Automation"],
  [/v3\.0\.0/g, "v0.1.0"],
  [/> Kayitli API anahtari bulundu\./g, "> Saved API key found."],
  [/API anahtarını değiştirmek için \/apikey yazın\./g, "Type /apikey to change API key."],
  [/Proje foldersu:/g, "Project folder:"],
  [/Klasör değiştirmek için \/folder yazın\./g, "Type /folder to change directory."],
  [/Mevcut model:/g, "Current model:"],
  [/Model değiştirmek için \/model yazın\./g, "Type /model to change model."],
  [/Oto\.çalıştırma: AÇIK \(\/autoexec ile değiştir\)/g, "Auto-run: ON (type /autoexec to toggle)"],
  [/Oto\.çalıştırma: KAPALI \(\/autoexec ile değiştir\)/g, "Auto-run: OFF (type /autoexec to toggle)"],
  [/\/help komutlar \| \/model model \| \/folder klasör \| \/autoexec oto\.çalıştırma: AÇIK/g, "/help commands | /model model | /folder folder | /autoexec auto-run: ON"],
  [/\/help komutlar \| \/model model \| \/folder klasör \| \/autoexec oto\.çalıştırma: KAPALI/g, "/help commands | /model model | /folder folder | /autoexec auto-run: OFF"],
  [/otomatik çalıştırıldı/g, "automatically executed"],
  [/Klasør değiştirmek için/g, "Type /folder to change directory"],
  [/API Anahtari Gerekli/g, "API Key Required"]
];

replacements.forEach(([tr, en]) => {
  content = content.replace(tr, en);
});

fs.writeFileSync(targetFile, content);
console.log('Language patched again.');
