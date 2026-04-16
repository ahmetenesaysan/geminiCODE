const pngToIco = require('png-to-ico');
const rcedit = require('rcedit');
const fs = require('fs');
const path = require('path');

async function main() {
  const iconPath = path.join(__dirname, '../gemini_logo.png');
  const icoDest = path.join(__dirname, '../gemini_logo.ico');
  const exePath = path.join(__dirname, '../GeminiCode.exe');

  console.log('Converting PNG to ICO...');
  const buf = await (pngToIco.default ? pngToIco.default(iconPath) : pngToIco(iconPath));
  fs.writeFileSync(icoDest, buf);
  console.log('Saved ICO to', icoDest);

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
  console.log('Done!');
}
main().catch(console.error);
