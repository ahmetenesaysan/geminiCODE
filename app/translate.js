const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
  ['Kurucu: Ahmetenesssssss', 'Founder: Ahmetenesssssss'],
  ['Hizli & guclu - Ucretsiz Preview', 'Fast & powerful - Free Preview'],
  ['En gelismis model - Preview', 'Most advanced model - Preview'],
  ['Hizli ve guclu - Ucretsiz', 'Fast and powerful - Free'],
  ['Hafif ve super hizli - Ucretsiz', 'Light and super fast - Free'],
  ['Dengeli performans - Ucretsiz', 'Balanced performance - Free'],
  ['Gelismis yetenekler - 1M token context', 'Advanced capabilities - 1M token context'],
  ['OLUŞTURULDU', 'CREATED'],
  ['DÜZENLENDİ', 'EDITED'],
  ['✓ DOSYA', '✓ FILE'],
  ['✗ DOSYA HATASI', '✗ FILE ERROR'],
  ['✓ DOSYA SİLİNDİ', '✓ FILE DELETED'],
  ['[i] Dosya zaten yok:', '[i] File already does not exist:'],
  ['✗ SİLME HATASI', '✗ DELETE ERROR'],
  ['▶ KOMUT ÇALIŞTIRILDI', '▶ COMMAND EXECUTED'],
  ['✓ ÇALIŞTI:', '✓ EXECUTED:'],
  ['⚠ ÇIKTI KODU:', '⚠ OUTPUT CODE:'],
  ['Calismak istediginiz proje klasorunu secin.', 'Select the project folder you want to work on.'],
  ['Bu klasordeki dosyalara erisim saglanacaktir.', 'Files in this folder will be accessed.'],
  ['Dosya okuma, yazma ve terminal komutlari bu klasorde calisacaktir.', 'File operations and terminal commands will run in this folder.'],
  ['Proje Klasoru Secimi', 'Project Folder Selection'],
  ['Klasor yolu gir (manuel)', 'Enter folder path (manual)'],
  ['Mevcut dizini kullan', 'Use current directory'],
  ['Son kullanilan klasor', 'Last used folder'],
  ['Masaustu', 'Desktop'],
  ['Belgeler', 'Documents'],
  ['Indirilenler', 'Downloads'],
  ['Klasorlerde gez (interaktif)', 'Browse folders (interactive)'],
  ['> Proje klasorunu secin:', '> Select project folder:'],
  ['> Klasor yolunu girin:', '> Enter folder path:'],
  ['Klasör bulunamadı:', 'Folder not found:'],
  ['Bu bir klasör değil!', 'This is not a folder!'],
  ['> Proje klasoru secildi!', '> Project folder selected!'],
  ['dosya,', 'files,'],
  ['klasor', 'folders'],
  ['✗ Klasöre geçilemedi:', '✗ Could not go to folder:'],
  ['✗ Klasör okunamadı:', '✗ Could not read folder:'],
  ['BU KLASÖRÜ SEÇ', 'SELECT THIS FOLDER'],
  ['Üst klasöre git', 'Go to parent folder'],
  ['── Alt Klasörler ──', '── Subfolders ──'],
  ['... ve', '... and'],
  ['klasör daha', 'more folders'],
  ['(Alt klasör yok)', '(No subfolders)'],
  ['> Klasor secin:', '> Select folder:'],
  ['API Anahtari Gerekli', 'API Key Required'],
  ['API anahtarınızı', 'You can get your API key from'],
  ['adresinden alabilirsiniz.', ''],
  ['Kullanmak istediginiz modeli secin:', 'Select the model you want to use:'],
  ['> Model secildi:', '> Model selected:'],
  ['> Kullanmak istediginiz modeli secin:', '> Select the model you want to use:'],
  ['API anahtarı doğrulanıyor...', 'Verifying API key...'],
  ['> API anahtari dogrulandi!', '> API key verified!'],
  ['> Model Secimi', '> Model Selection'],
  ['Gemini Code\\\'u kullanmak için bir Google Gemini API anahtarına ihtiyacınız var.', 'You need a Google Gemini API key to use Gemini Code.'],
  ['API anahtarı geçersiz. Lütfen doğru anahtarı girin.', 'Invalid API key. Please enter a correct key.'],
  ['Bağlantı hatası:', 'Connection error:'],
  ['API Anahtarinizi girin:', 'Enter your API Key:'],
  ['Geçerli bir API anahtarı girin.', 'Enter a valid API key.'],
  ['PROJE YAPISI', 'PROJECT STRUCTURE'],
  ['klasör okunamadı', 'could not read folder'],
  ['Okunamadı:', 'Could not read:'],
  ['Sen sadece öneri yapan bir AI değilsin', 'You are not just an AI making suggestions'],
  ['gerçekten dosya oluşturan', 'you are a coding AGENT that actually creates'],
  ['düzenleyen, silen ve terminal komutları çalıştıran bir kodlama AJANISIN.', 'edits, deletes files, and runs terminal commands.'],
  ['Dosya oluşturmak veya düzenlemek için MUTLAKA şu formatı kullan:', 'To create or edit a file, MUST use the following format:'],
  ['dosya içeriği buraya', 'file content here'],
  ['yeni dosya içeriği buraya', 'new file content here'],
  ['TAM dosya içeriği, sadece değişiklik değil', 'FULL file content, not just changes'],
  ['dosya/yolu.uzantı', 'file/path.ext'],
  ['Terminal komutu çalıştırmak için:', 'To run a terminal command:'],
  ['komut buraya', 'command here'],
  ['Birden fazla komut:', 'Multiple commands:'],
  ['Kullanıcı dosya oluşturmasını/düzenlemesini istediğinde MUTLAKA bu formatları kullan', 'When the user asks to create/edit a file, MUST use these formats'],
  ['Kullanıcı bir şey kurmasını/çalıştırmasını istediğinde TERMINAL bloğu kullan', 'When the user asks to install/run something, use the TERMINAL block'],
  ['Tüm işlemler OTOMATIK yapılır — kullanıcıdan onay isteme', 'All operations are done AUTOMATICALLY — do not ask for user approval'],
  ['Dosya yollarını proje klasörüne göre belirt (göreceli veya mutlak)', 'Specify file paths relative to the project folder (relative or absolute)'],
  ['FILE_EDIT\\\'te tam dosya içeriğini ver, kısmi değil', 'In FILE_EDIT provide full file content, not partial'],
  ['Her zaman Türkçe konuş ama kod ve komutlar İngilizce olabilir', 'Always speak English, code and commands must be in English'],
  ['Mevcut proje klasörü:', 'Current project folder:'],
  ['AKTİF MİSYON', 'ACTIVE MISSION'],
  ['Kullanıcının istediği her dosyayı anında yarat, her komutu anında çalıştır.', 'Instantly create every file the user wants, run every command instantly.'],
  ['"Şunu yapabilirsin" değil, "Yaptım" de.', 'Do not say "You can do this", say "I did this".']
];

replacements.forEach(([tr, en]) => {
  const re = new RegExp(tr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  content = content.replace(re, en);
});

fs.writeFileSync(targetFile, content);
console.log('index.js translated to English.');

// also fix build-icon.js fallback for png-to-ico
const iconFile = path.join(__dirname, 'build-icon.js');
let iconContent = fs.readFileSync(iconFile, 'utf8');
iconContent = iconContent.replace(/const buf = await pngToIco\(iconPath\);/g, 'const buf = await (pngToIco.default ? pngToIco.default(iconPath) : pngToIco(iconPath));');
fs.writeFileSync(iconFile, iconContent);
console.log('build-icon.js patched.');
