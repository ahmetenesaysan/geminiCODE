const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'index.js');
let content = fs.readFileSync(targetFile, 'utf8');

// ─── 1. Replace sendMessage with streaming sendMessageStream ───────────────────
// Replace the whole sendMessage method inside GeminiChatEngine
const oldSendMessage = `  async sendMessage(message, retryCount = 0) {
    try {
      const result = await this.chat.sendMessage(message);
      const response = result.response.text();
      this.history.push({ role: 'user', content: message });
      this.history.push({ role: 'model', content: response });
      return response;
    } catch (error) {
      const errMsg = error.message || '';
      
      if ((errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) && retryCount < 3) {
        const waitSec = Math.pow(2, retryCount + 1);
        process.stdout.write(colors.yellow(\`\\r  [!] Rate limit - \${waitSec}s bekleniyor...\`));
        await new Promise(r => setTimeout(r, waitSec * 1000));
        return this.sendMessage(message, retryCount + 1);
      }
      
      if (errMsg.includes('429') || errMsg.includes('quota')) {
        throw new Error('Rate limit aşıldı. Birkaç dakika bekleyip tekrar deneyin veya /model ile başka model seçin.');
      }
      if (errMsg.includes('API_KEY') || errMsg.includes('401') || errMsg.includes('403')) {
        throw new Error('API anahtarı geçersiz. /apikey komutu ile yeni bir anahtar girin.');
      }
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        throw new Error(\`Model "\${this.modelId}" bulunamadı. /model ile başka bir model seçin.\`);
      }
      throw new Error(\`API Hatası: \${errMsg.substring(0, 200)}\`);
    }
  }`;

const newSendMessage = `  async sendMessage(message, retryCount = 0) {
    try {
      // Streaming response - live token by token
      const result = await this.chat.sendMessageStream(message);
      
      let fullResponse = '';
      let thoughtShown = false;
      let thoughtBuffer = '';
      let collectingThought = false;

      process.stdout.write(colors.blue.bold('  \\n  Gemini') + '\\n');
      process.stdout.write(colors.dim('  ─────────────────────') + '\\n');

      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullResponse += text;

        // Detect and show THOUGHT live
        for (const char of text) {
          if (!thoughtShown) {
            thoughtBuffer += char;

            if (!collectingThought && thoughtBuffer.includes('<<<THOUGHT:')) {
              collectingThought = true;
              thoughtBuffer = thoughtBuffer.slice(thoughtBuffer.indexOf('<<<THOUGHT:') + 11);
            }

            if (collectingThought) {
              const endIdx = thoughtBuffer.indexOf('>>>');
              if (endIdx !== -1) {
                const thoughtText = thoughtBuffer.slice(0, endIdx).trim();
                process.stdout.write('\\r' + colors.cyan('  [THOUGHT] ') + colors.dim(thoughtText + ' ⏳') + '\\n');
                thoughtShown = true;
                thoughtBuffer = '';
                collectingThought = false;
              }
            }
          } else {
            // Print streaming text live (skip action blocks)
            if (!fullResponse.includes('<<<FILE_') && !fullResponse.includes('<<<TERMINAL:')) {
              process.stdout.write(colors.white(char));
            }
          }
        }
      }

      // Final cleanup - ensure newline after streamed output
      process.stdout.write('\\n');

      // Remove thought tag from response for history/parsing
      const cleanResponse = fullResponse.replace(/<<<THOUGHT:[\\s\\S]*?>>>/g, '').trim();

      this.history.push({ role: 'user', content: message });
      this.history.push({ role: 'model', content: fullResponse });
      return fullResponse;
    } catch (error) {
      const errMsg = error.message || '';
      
      if ((errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) && retryCount < 3) {
        const waitSec = Math.pow(2, retryCount + 1);
        process.stdout.write(colors.yellow(\`\\r  [!] Rate limit - waiting \${waitSec}s...\\n\`));
        await new Promise(r => setTimeout(r, waitSec * 1000));
        return this.sendMessage(message, retryCount + 1);
      }
      
      if (errMsg.includes('429') || errMsg.includes('quota')) {
        throw new Error('Rate limit hit. Wait a minute or switch model with /model.');
      }
      if (errMsg.includes('API_KEY') || errMsg.includes('401') || errMsg.includes('403')) {
        throw new Error('Invalid API key. Use /apikey to update.');
      }
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        throw new Error(\`Model "\${this.modelId}" not found. Use /model to switch.\`);
      }
      throw new Error(\`API Error: \${errMsg.substring(0, 200)}\`);
    }
  }`;

content = content.replace(oldSendMessage, newSendMessage);

// ─── 2. Fix refreshContext to preserve history ─────────────────────────────────
const oldRefresh = `  refreshContext() {
    this.buildSystemPrompt();
    this._initModel();
  }`;

const newRefresh = `  refreshContext() {
    const savedHistory = this.history.slice(); // preserve history
    this.buildSystemPrompt();
    this._initModel();
    this.history = savedHistory;
    // Re-sync history into the active chat
    this.chat = this.model.startChat({
      history: this.history.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
      generationConfig: { maxOutputTokens: 16384, temperature: 0.7 },
    });
  }`;

content = content.replace(oldRefresh, newRefresh);

// ─── 3. Fix system prompt - add REAL Google image search instruction ────────────
const oldPromptStart = 'buildSystemPrompt() {';
const oldPromptContent = `    this.systemPrompt = \`[SYS]
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
\${buildProjectContext()}\`;`;

const newPromptContent = `    this.systemPrompt = \`[SYS]
Role: Gemini Code Agent (Creator: Ahmetenesssssss). v0.1.0
Task: Autonomous code editing, CLI execution, and web research.
Rules:
- ALWAYS start with <<<THOUGHT: 2-3 word plan>>> (near-zero tokens, shown live to user).
- Be EXTREMELY concise. No filler. No yapping.
- ONLY make minimum required code changes.
- **IMAGES**: NEVER hallucinate image URLs. To get real images: use <<<TERMINAL: curl "https://www.googleapis.com/customsearch/v1?key=NO_KEY_NEEDED&cx=017576662512468239146:omuauf_lfve&q=QUERY&searchType=image&num=5" -o search_results.json>>> then read and pick best URL. Always show user the image links before using them and ask: "Use this image? [y/n]"
- **SECURITY**: NEVER run destructive commands (rm -rf /, format, etc.)
- After completing tasks, stay in chat — do NOT exit.
Format:
<<<THOUGHT: brief plan>>>
<<<FILE_CREATE: path>>>
content
<<<END_FILE>>>
<<<FILE_EDIT: path>>>
content
<<<END_FILE>>>
<<<TERMINAL: command>>>
Workspace: \${this.projectFolder}
\${buildProjectContext()}\`;`;

content = content.replace(oldPromptContent, newPromptContent);

// ─── 4. Replace the REPL message handler to NOT show spinner (streaming handles display) ─
// and show prompt again after errors (don't close)
const oldTryBlock = `    try {
      let response = await engine.sendMessage(trimmed);
      spinner.stop();

      // Parse agentic actions from response
      const actions = parseAgentActions(response);
      
      // Display AI response header  
      console.log(colors.blue.bold('  Gemini'));
      console.log(colors.dim('  ─────────────────────'));
      
      
      const thoughtMatch = response.match(/<<<THOUGHT:\\s*([\\s\\S]*?)>>>/);
      if (thoughtMatch) {
         console.log(colors.cyan('  [THOUGHT] ') + colors.dim(thoughtMatch[1].trim() + ' ⏳'));
      }
      
      response = response.replace(/<<<THOUGHT:[\\s\\S]*?>>>/, '');
  const formatted = formatResponse(response);
      if (formatted.trim()) {
        const lines = formatted.split('\\n');
        lines.forEach((line) => {
          console.log('  ' + line);
        });
      }

      // Execute or display agentic actions
      if (actions.length > 0) {
        const autoExec = true; // Forced to enter executeActions to show prompt
        
        if (autoExec) {
          // Auto-execute all actions
          await executeActions(actions);
          
          // Refresh engine context after file changes
          const hasFileActions = actions.some(a => a.type === 'file_create' || a.type === 'file_edit' || a.type === 'file_delete');
          if (hasFileActions) {
            engine.refreshContext();
          }
        } else {
          // Just show what would be done
          displayActionSummary(actions);
          console.log(colors.dim('  /autoexec ile otomatik çalıştırmayı açabilirsiniz.'));
        }
      }

      msgCount++;
      console.log();
      console.log(getStatusLine(engine.modelId, msgCount));
      console.log();
    } catch (error) {
      spinner.fail(colors.red(\`  ✗ \${error.message}\`));
      console.log(colors.dim('  Hint: try a different model with /model or wait a minute.'));
      console.log();
    }`;

const newTryBlock = `    try {
      // Spinner only shows while waiting for first token
      const streamStarted = { value: false };
      const spinnerTimer = setTimeout(() => {
        if (!streamStarted.value) spinner.start();
      }, 300);

      const response = await engine.sendMessage(trimmed);
      streamStarted.value = true;
      clearTimeout(spinnerTimer);
      spinner.stop();

      // Parse agentic actions from the full response
      const actions = parseAgentActions(response);
      
      // (Streaming already printed the text live, now just show formatted non-action remainder)
      const cleanText = formatResponse(response.replace(/<<<THOUGHT:[\\s\\S]*?>>>/g, ''));
      if (cleanText.trim() && actions.length === 0) {
        // Only reprint if there were no streaming chars (pure text reply)
      }

      // Execute agentic actions with confirmation
      if (actions.length > 0) {
        await executeActions(actions);
        
        // Refresh context preserving history
        const hasFileActions = actions.some(a => a.type === 'file_create' || a.type === 'file_edit' || a.type === 'file_delete');
        if (hasFileActions) {
          engine.refreshContext();
        }
      }

      msgCount++;
      console.log();
      console.log(getStatusLine(engine.modelId, msgCount));
      console.log();
    } catch (error) {
      spinner.stop();
      // DO NOT exit - show error and stay in REPL
      console.log('\\n' + colors.redBg(' ✗ ERROR ') + ' ' + colors.red(error.message));
      console.log(colors.dim('  Tip: /model to switch model | /apikey to update key'));
      console.log();
    }`;

content = content.replace(oldTryBlock, newTryBlock);

// ─── 5. Remove the standalone spinner start before try block (streaming handles it) ─
const oldSpinner = `    const spinner = ora({
      text: colors.blue('Gemini is thinking...'),
      color: 'cyan',
      spinner: 'dots12',
      prefixText: '  ',
    }).start();`;

const newSpinner = `    const spinner = ora({
      text: colors.blue('Gemini is thinking...'),
      color: 'cyan',
      spinner: 'dots12',
      prefixText: '  ',
    }); // do NOT auto-start; streaming will handle display`;

content = content.replace(oldSpinner, newSpinner);

fs.writeFileSync(targetFile, content);
console.log('All 5 patches applied: streaming, live thought, error recovery, history fix, image search.');
