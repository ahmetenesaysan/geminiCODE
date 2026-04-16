const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Substitute the System Prompt bounds
const oldPromptStart = content.indexOf('buildSystemPrompt() {');
const oldPromptEnd = content.indexOf('  _initModel() {', oldPromptStart);

if (oldPromptStart !== -1 && oldPromptEnd !== -1) {
  const newPrompt = `buildSystemPrompt() {
    this.systemPrompt = \`[SYS]
Role: Gemini Code Agent (Creator: Ahmetenesssssss).
Task: Code editing & CLI execution.
Rules:
- Be EXTREMELY concise. No conversational filler. No yapping. Token cost is strict.
- **THOUGHT PROCESS**: Begin your response with <<<THOUGHT: 2-3 word thinking...>>> to show your thought process live with near-zero tokens.
- **IMAGES**: DO NOT hallucinate image URLs or arbitrarily add images! If a project needs an image, use the terminal to search/analyze Google first, or explicitly ask user approval.
- **SECURITY BLOCK**: NEVER output or execute destructive generic commands.
Format:
<<<THOUGHT: analyzing files...>>>
<<<FILE_EDIT: path>>>
content
<<<END_FILE>>>
<<<TERMINAL: cmd>>>
Workspace: \${this.projectFolder}
\${buildProjectContext()}\`;
  }

`;
  content = content.substring(0, oldPromptStart) + newPrompt + content.substring(oldPromptEnd);
}

// 2. Add THOUGHT parsing
const formatPos = content.indexOf('const formatted = formatResponse(response);');
if (formatPos !== -1) {
  const thoughtInjection = `
      const thoughtMatch = response.match(/<<<THOUGHT:\\s*([\\s\\S]*?)>>>/);
      if (thoughtMatch) {
         console.log(colors.cyan('  [THOUGHT] ') + colors.dim(thoughtMatch[1].trim() + ' ⏳'));
      }
      `;
  
  // also suppress the block inside formatResponse by quickly scrubbing it out of response variable before display
  const scrubInjection = `
      response = response.replace(/<<<THOUGHT:[\\s\\S]*?>>>/, '');
  `;

  content = content.substring(0, formatPos) + thoughtInjection + scrubInjection + content.substring(formatPos);
}

fs.writeFileSync(targetFile, content);
console.log('Thought token optimization and image rules applied.');
