const rcedit = require('rcedit');
const path = require('path');

async function main() {
  const icoDest = path.join(__dirname, '../gemini_logo.ico');
  const exePath = path.join(__dirname, '../GeminiCode.exe');

  console.log('Setting icon to executable...');
  await rcedit(exePath, {
    icon: icoDest,
    "version-string": {
      "CompanyName": "Ahmetenesssssss",
      "FileDescription": "Gemini Code Assistant",
      "ProductName": "Gemini Code",
      "LegalCopyright": "Copyright (c) 2026 Ahmetenesssssss"
    }
  });
  console.log('Icon injected!');
}
main().catch(console.error);
