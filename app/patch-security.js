const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. API Key Persistence Removal
content = content.replace("config.set('apiKey', apiKey.trim());", "// config.set('apiKey', apiKey.trim()); // Persistence Disabled");
content = content.replace("let apiKey = config.get('apiKey');", "let apiKey = ''; // Always ask per session");

// 2. Full Stack Protection & Token Optimization in System Prompt
const oldPromptStart = content.indexOf('buildSystemPrompt() {');
const oldPromptEnd = content.indexOf('  _initModel() {', oldPromptStart);
if (oldPromptStart !== -1 && oldPromptEnd !== -1) {
  const newPrompt = `buildSystemPrompt() {
    this.systemPrompt = \`[SYS]
Role: Gemini Code Agent (Creator: Ahmetenesssssss).
Task: Code editing & CLI execution.
Rules:
- Be EXTREMELY concise. No conversational filler. No yapping. Saving tokens is critical.
- Provide requested code using exactly FILE_CREATE or FILE_EDIT.
- ONLY provide the minimum code changes necessary.
- **SECURITY BLOCK**: NEVER output or execute destructive generic commands like 'rm -rf /' or formatting drives. Avoid reading system files outside the workspace.
Format:
<<<FILE_EDIT: path>>>
content
<<<END_FILE>>>
Terminal:
<<<TERMINAL: cmd>>>
Current Workspace: \${this.projectFolder}
\${buildProjectContext()}\`;
  }

`;
  content = content.substring(0, oldPromptStart) + newPrompt + content.substring(oldPromptEnd);
}

// 3. Confirmation before Execution
const execStart = content.indexOf('async function executeActions(actions) {');
const execCheck = content.indexOf('const results = [];', execStart);
if (execStart !== -1 && execCheck !== -1) {
  const injection = `
  console.log('\\n' + colors.yellowBg(' ⚠ CONFIRMATION REQUIRED ') + ' Gemini wants to perform the following actions:');
  console.log(colors.dim('  ─────────────────────────────────────'));
  for (const action of actions) {
    if (action.type === 'file_create') {
      console.log('  ' + colors.green('+CREATE') + ' ' + action.filePath);
      console.log(colors.dim('    ' + action.content.split('\\n').length + ' lines'));
    } else if (action.type === 'file_edit') {
      console.log('  ' + colors.yellow('~EDIT') + ' ' + action.filePath);
      console.log(colors.dim('    ' + action.content.split('\\n').length + ' lines replaced'));
    } else if (action.type === 'file_delete') {
      console.log('  ' + colors.red('-DELETE') + ' ' + action.filePath);
    } else if (action.type === 'terminal') {
      console.log('  ' + colors.cyan('>EXEC') + ' ' + action.command);
    }
  }
  console.log(colors.dim('  ─────────────────────────────────────'));
  
  const { confirmExec } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmExec',
      message: colors.yellow('Do you approve these actions?'),
      default: false
    }
  ]);

  if (!confirmExec) {
    console.log(colors.red('  ✗ Actions aborted by user.'));
    return ['✗ User denied the actions.'];
  }

  const results = [];`;
  
  content = content.substring(0, execCheck) + injection + content.substring(execCheck + 19);
}

// Ensure execution display bypasses autoExec check in main loop since we already check inside executeActions
content = content.replace("const autoExec = config.get('autoExec');", "const autoExec = true; // Forced to enter executeActions to show prompt");

// Also replace leftovers
content = content.replace(/✓ FILE SİLİNDİ/g, "✓ FILE DELETED");
content = content.replace(/SİLİNDİ:/g, "DELETED:");
content = content.replace(/HATA/g, "ERROR");

fs.writeFileSync(targetFile, content);
console.log('Safety patches applied.');
