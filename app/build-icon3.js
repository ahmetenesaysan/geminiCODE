const resedit = require('resedit');
const fs = require('fs');
const path = require('path');

async function main() {
  const exePath = path.join(__dirname, '../GeminiCode.exe');
  const icoPath = path.join(__dirname, '../gemini_logo.ico');
  
  console.log("Loading PE...");
  let data = fs.readFileSync(exePath);
  let exe = resedit.NtExecutable.from(data);
  let res = resedit.NtExecutableResource.from(exe);

  console.log("Loading Icon...");
  let iconFile = resedit.Data.IconFile.from(fs.readFileSync(icoPath));
  
  console.log("Replacing Icon in Resources...");
  resedit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries, 1, 1033, iconFile.icons.map(item => item.data)
  );

  res.outputResource(exe);
  
  console.log("Generating Modified Executable...");
  let out = exe.generate(); 
  
  fs.writeFileSync(exePath, Buffer.from(out));
  console.log("Icon successfully changed with resedit without breaking pkg EOF payload!");
}

main().catch(console.error);
