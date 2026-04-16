#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║       GEMINI CODE - Terminal AI Coding Assistant      ║
 * ║      Powered by Google DeepMind's Gemini API          ║
 * ║         Creator: Ahmetenesssssss                       ║
 * ╚══════════════════════════════════════════════════════╝
 */

// Suppress Node.js ExperimentalWarning for Fetch API
process.removeAllListeners('warning');
process.on('warning', (w) => { if (w.name !== 'ExperimentalWarning') console.warn(w); });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const Conf = require('conf');
const figlet = require('figlet');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════════
// GEMINI BRAND COLORS
// ═══════════════════════════════════════════════════
const colors = {
  blue: chalk.hex('#4285F4'),
  green: chalk.hex('#0F9D58'),
  yellow: chalk.hex('#F4B400'),
  red: chalk.hex('#DB4437'),
  cyan: chalk.hex('#00BCD4'),
  purple: chalk.hex('#9C27B0'),
  orange: chalk.hex('#FF9800'),
  teal: chalk.hex('#009688'),
  white: chalk.white,
  gray: chalk.gray,
  dim: chalk.dim,
  bold: chalk.bold,
  blueBg: chalk.bgHex('#4285F4').white.bold,
  greenBg: chalk.bgHex('#0F9D58').white.bold,
  yellowBg: chalk.bgHex('#F4B400').black.bold,
  redBg: chalk.bgHex('#DB4437').white.bold,
  cyanBg: chalk.bgHex('#00BCD4').black.bold,
  purpleBg: chalk.bgHex('#9C27B0').white.bold,
};

// ═══════════════════════════════════════════════════
// CONFIGURATION STORE
// ═══════════════════════════════════════════════════
const config = new Conf({
  projectName: 'gemini-code',
  schema: {
    apiKey: { type: 'string', default: '' },
    selectedModel: { type: 'string', default: 'gemini-2.0-flash' },
    theme: { type: 'string', default: 'dark' },
    history: { type: 'array', default: [] },
    projectFolder: { type: 'string', default: '' },
    hasRunBefore: { type: 'boolean', default: false },
    autoExec: { type: 'boolean', default: true },
  },
});

// ═══════════════════════════════════════════════════
// AVAILABLE GEMINI MODELS
// ═══════════════════════════════════════════════════
const MODELS = [
  {
    name: 'Gemini 2.5 Flash Preview (Free)',
    value: 'gemini-2.5-flash-preview-05-20',
    description: 'Fast & powerful - Free Preview',
    tier: 'free',
    icon: '[+]',
  },
  {
    name: 'Gemini 2.5 Pro Preview',
    value: 'gemini-2.5-pro-preview-05-06',
    description: 'Most advanced model - Preview',
    tier: 'preview',
    icon: '[~]',
  },
  {
    name: 'Gemini 2.0 Flash (Free)',
    value: 'gemini-2.0-flash',
    description: 'Fast and powerful - Free',
    tier: 'free',
    icon: '[>]',
  },
  {
    name: 'Gemini 2.0 Flash Lite (Free)',
    value: 'gemini-2.0-flash-lite',
    description: 'Light and super fast - Free',
    tier: 'free',
    icon: '[-]',
  },
  {
    name: 'Gemini 1.5 Flash (Free)',
    value: 'gemini-1.5-flash',
    description: 'Balanced performance - Free',
    tier: 'free',
    icon: '[=]',
  },
  {
    name: 'Gemini 1.5 Pro',
    value: 'gemini-1.5-pro',
    description: 'Advanced capabilities - 1M token context',
    tier: 'pro',
    icon: '[^]',
  },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════
function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[0f');
}

function getGradientText(text) {
  const chars = text.split('');
  const colorFns = [colors.blue, colors.green, colors.yellow, colors.red];
  return chars
    .map((char, i) => colorFns[i % colorFns.length](char))
    .join('');
}

function drawLogo() {
  try {
    const logo = figlet.textSync('GEMINI CODE', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
    });
    const lines = logo.split('\n');
    lines.forEach((line, i) => {
      const colorFns = [colors.blue, colors.green, colors.yellow, colors.red];
      console.log(colorFns[i % colorFns.length](line));
    });
  } catch {
    console.log(getGradientText('╔══════════════════════════════════════════════════╗'));
    console.log(getGradientText('║            G E M I N I   C O D E                ║'));
    console.log(getGradientText('╚══════════════════════════════════════════════════╝'));
  }
}

function drawPremiumBox(content, title = '', color = colors.blue) {
  const lines = content.split('\n');
  const maxLen = Math.max(...lines.map((l) => stripAnsi(l).length), stripAnsi(title).length + 4);
  const width = Math.min(maxLen + 4, process.stdout.columns - 4 || 76);

  console.log(color('╔═' + (title ? `═ ${title} ` : '') + '═'.repeat(Math.max(0, width - stripAnsi(title).length - 5)) + '═╗'));
  lines.forEach((line) => {
    const stripped = stripAnsi(line);
    const pad = Math.max(0, width - stripped.length - 2);
    console.log(color('║ ') + line + ' '.repeat(pad) + color(' ║'));
  });
  console.log(color('╚═' + '═'.repeat(width - 2) + '═╝'));
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function getModelDisplayName(modelId) {
  const model = MODELS.find((m) => m.value === modelId);
  return model ? `${model.icon} ${model.name}` : modelId;
}

function getTierBadge(tier) {
  switch (tier) {
    case 'free': return colors.greenBg(' FREE ');
    case 'pro': return colors.blueBg(' PRO ');
    case 'preview': return colors.yellowBg(' PREVIEW ');
    default: return '';
  }
}

// ═══════════════════════════════════════════════════
// AGENTIC ACTION PARSER & EXECUTOR
// ═══════════════════════════════════════════════════
/**
 * Parse AI response for special action blocks:
 *   <<<FILE_CREATE: path/to/file>>>
 *   content here
 *   <<<END_FILE>>>
 *
 *   <<<FILE_EDIT: path/to/file>>>
 *   content here
 *   <<<END_FILE>>>
 *
 *   <<<FILE_DELETE: path/to/file>>>
 *
 *   <<<TERMINAL: command here>>>
 *
 * Also parses standard markdown code blocks with file hints:
 *   // filepath: src/index.js   (first line of code block)
 */
function parseAgentActions(text) {
  const actions = [];

  // ── 1. Explicit action blocks ──────────────────────
  // FILE_CREATE / FILE_EDIT
  const fileBlockRe = /<<<(FILE_CREATE|FILE_EDIT):\s*(.+?)>>>\n([\s\S]*?)<<<END_FILE>>>/g;
  let m;
  while ((m = fileBlockRe.exec(text)) !== null) {
    actions.push({
      type: m[1] === 'FILE_CREATE' ? 'file_create' : 'file_edit',
      filePath: m[2].trim(),
      content: m[3],
    });
  }

  // FILE_DELETE
  const fileDelRe = /<<<FILE_DELETE:\s*(.+?)>>>/g;
  while ((m = fileDelRe.exec(text)) !== null) {
    actions.push({ type: 'file_delete', filePath: m[1].trim() });
  }

  // TERMINAL
  const termRe = /<<<TERMINAL:\s*([\s\S]+?)>>>/g;
  while ((m = termRe.exec(text)) !== null) {
    actions.push({ type: 'terminal', command: m[1].trim() });
  }

  // ── 2. Markdown code blocks with filepath hint ─────
  // Matches: ```lang\n// filepath: some/path\ncontent\n```
  const mdFileRe = /```[\w]*\n(?:\/\/\s*filepath:\s*(.+?)\n)([\s\S]*?)```/g;
  while ((m = mdFileRe.exec(text)) !== null) {
    const alreadyHandled = actions.some(a => a.filePath === m[1].trim());
    if (!alreadyHandled) {
      actions.push({
        type: 'file_create',
        filePath: m[1].trim(),
        content: m[2],
      });
    }
  }

  // ── 3. Shell/bash code blocks as terminal commands ──
  const bashRe = /```(?:bash|sh|powershell|cmd|shell)\n([\s\S]*?)```/g;
  while ((m = bashRe.exec(text)) !== null) {
    const cmd = m[1].trim();
    // Only auto-run if not already found as TERMINAL block
    const alreadyHandled = actions.some(a => a.type === 'terminal' && a.command === cmd);
    if (!alreadyHandled && cmd.length > 0) {
      // Skip pure comment-only blocks
      const nonComment = cmd.split('\n').filter(l => !l.startsWith('#') && l.trim());
      if (nonComment.length > 0) {
        actions.push({ type: 'terminal', command: cmd });
      }
    }
  }

  return actions;
}

/**
 * Execute a list of parsed actions (file ops + terminal).
 * Returns a summary string of what was done.
 */
async function executeActions(actions) {
  if (actions.length === 0) return null;

  
  console.log('\n' + colors.yellowBg(' ⚠ CONFIRMATION REQUIRED ') + ' Gemini wants to perform the following actions:');
  console.log(colors.dim('  ─────────────────────────────────────'));
  for (const action of actions) {
    if (action.type === 'file_create') {
      console.log('  ' + colors.green('+CREATE') + ' ' + action.filePath);
      console.log(colors.dim('    ' + action.content.split('\n').length + ' lines'));
    } else if (action.type === 'file_edit') {
      console.log('  ' + colors.yellow('~EDIT') + ' ' + action.filePath);
      console.log(colors.dim('    ' + action.content.split('\n').length + ' lines replaced'));
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

  const results = [];

  for (const action of actions) {
    if (action.type === 'file_create' || action.type === 'file_edit') {
      const label = action.type === 'file_create' ? 'CREATED' : 'EDITED';
      try {
        const absPath = path.isAbsolute(action.filePath)
          ? action.filePath
          : path.resolve(process.cwd(), action.filePath);
        const dir = path.dirname(absPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(absPath, action.content, 'utf-8');
        console.log(
          '\n' + colors.greenBg(` ✓ FILE ${label} `) + ' ' +
          colors.green(absPath)
        );
        results.push(`✓ ${label}: ${absPath}`);
      } catch (err) {
        console.log(colors.redBg(` ✗ FILE ERROR `) + ' ' + colors.red(err.message));
        results.push(`✗ ERROR (${action.filePath}): ${err.message}`);
      }

    } else if (action.type === 'file_delete') {
      try {
        const absPath = path.isAbsolute(action.filePath)
          ? action.filePath
          : path.resolve(process.cwd(), action.filePath);
        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
          console.log(colors.yellowBg(` ✓ FILE DELETED `) + ' ' + colors.yellow(absPath));
          results.push(`✓ DELETED: ${absPath}`);
        } else {
          console.log(colors.dim(`  [i] File already does not exist: ${absPath}`));
        }
      } catch (err) {
        console.log(colors.redBg(` ✗ DELETE ERROR `) + ' ' + colors.red(err.message));
        results.push(`✗ DELETE ERROR (${action.filePath}): ${err.message}`);
      }

    } else if (action.type === 'terminal') {
      console.log('\n' + colors.cyanBg(` ▶ COMMAND EXECUTED `) + ' ' + colors.cyan(action.command));
      console.log(colors.dim('  ─────────────────────────────────────'));
      try {
        const output = execSync(action.command, {
          encoding: 'utf-8',
          timeout: 60000,
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        if (output && output.trim()) {
          output.trim().split('\n').forEach(line => {
            console.log(colors.dim('  │ ') + colors.white(line));
          });
        }
        results.push(`✓ EXECUTED: ${action.command}`);
      } catch (err) {
        if (err.stdout && err.stdout.trim()) {
          err.stdout.trim().split('\n').forEach(line => {
            console.log(colors.dim('  │ ') + colors.white(line));
          });
        }
        if (err.stderr && err.stderr.trim()) {
          err.stderr.trim().split('\n').forEach(line => {
            console.log(colors.dim('  │ ') + colors.red(line));
          });
        }
        results.push(`⚠ OUTPUT CODE: ${action.command}`);
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════
// PROJECT FOLDER SELECTION
// ═══════════════════════════════════════════════════
async function selectProjectFolder() {
  console.log();
  drawPremiumBox(
    colors.white('Select the project folder you want to work on.') + '\n' +
      colors.dim('Files in this folder will be accessed.') + '\n' +
      colors.dim('File operations and terminal commands will run in this folder.'),
    'Project Folder Selection',
    colors.cyan
  );
  console.log();

  const savedFolder = config.get('projectFolder');
  
  const choices = [
    {
      name: colors.yellow('[>] ') + colors.white.bold('Enter folder path (manual)'),
      value: 'manual',
    },
    {
      name: colors.blue('[=] ') + colors.white.bold('Use current directory') + colors.dim(` (${process.cwd()})`),
      value: 'current',
    },
  ];

  if (savedFolder && fs.existsSync(savedFolder)) {
    choices.unshift({
      name: colors.green('[*] ') + colors.white.bold('Last used folder') + colors.dim(` (${savedFolder})`),
      value: 'saved',
    });
  }

  try {
    const desktopPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');
    const documentsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents');
    const downloadsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
    
    if (fs.existsSync(desktopPath)) {
      choices.push({
        name: colors.cyan('[D] ') + colors.white('Desktop') + colors.dim(` (${desktopPath})`),
        value: desktopPath,
      });
    }
    if (fs.existsSync(documentsPath)) {
      choices.push({
        name: colors.cyan('[B] ') + colors.white('Documents') + colors.dim(` (${documentsPath})`),
        value: documentsPath,
      });
    }
    if (fs.existsSync(downloadsPath)) {
      choices.push({
        name: colors.cyan('[I] ') + colors.white('Downloads') + colors.dim(` (${downloadsPath})`),
        value: downloadsPath,
      });
    }
  } catch (e) {}

  choices.push({
    name: colors.red('[?] ') + colors.white.bold('Browse folders (interactive)'),
    value: 'browse',
  });

  const { folderChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'folderChoice',
      message: colors.cyan('> Select project folder:'),
      choices: choices,
      pageSize: 10,
    },
  ]);

  let selectedFolder = '';

  if (folderChoice === 'saved') {
    selectedFolder = savedFolder;
  } else if (folderChoice === 'current') {
    selectedFolder = process.cwd();
  } else if (folderChoice === 'manual') {
    const { manualPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'manualPath',
        message: colors.cyan('> Enter folder path:'),
        default: process.cwd(),
        validate: (input) => {
          const resolved = path.resolve(input.trim());
          if (!fs.existsSync(resolved)) {
            return colors.red(`Folder not found: ${resolved}`);
          }
          if (!fs.statSync(resolved).isDirectory()) {
            return colors.red('This is not a folder!');
          }
          return true;
        },
      },
    ]);
    selectedFolder = path.resolve(manualPath.trim());
  } else if (folderChoice === 'browse') {
    selectedFolder = await browseFolder(process.cwd());
  } else {
    selectedFolder = await browseFolder(folderChoice);
  }

  try {
    process.chdir(selectedFolder);
    config.set('projectFolder', selectedFolder);
    
    let fileCount = 0;
    let dirCount = 0;
    try {
      const entries = fs.readdirSync(selectedFolder);
      entries.forEach(entry => {
        try {
          const stat = fs.statSync(path.join(selectedFolder, entry));
          if (stat.isDirectory()) dirCount++;
          else fileCount++;
        } catch(e) {}
      });
    } catch(e) {}

    console.log();
    console.log(colors.green(`  > Project folder selected!`));
    console.log(colors.dim(`  [DIR] ${selectedFolder}`));
    console.log(colors.dim(`  [i] ${fileCount} files, ${dirCount} folders`));
    console.log();
    
    return selectedFolder;
  } catch (error) {
    console.log(colors.red(`  ✗ Could not go to folder: ${error.message}`));
    return selectProjectFolder();
  }
}

async function browseFolder(startPath) {
  let currentPath = path.resolve(startPath);

  while (true) {
    console.log();
    console.log(colors.cyan.bold(`  [DIR] ${currentPath}`));
    console.log(colors.dim('  ─────────────────────────────────────'));

    let entries = [];
    try {
      entries = fs.readdirSync(currentPath)
        .filter(entry => {
          try {
            return fs.statSync(path.join(currentPath, entry)).isDirectory();
          } catch {
            return false;
          }
        })
        .filter(entry => !entry.startsWith('.') && entry !== 'node_modules' && entry !== '__pycache__')
        .sort();
    } catch (err) {
      console.log(colors.red(`  ✗ Could not read folder: ${err.message}`));
      return currentPath;
    }

    const choices = [
      {
        name: colors.green.bold('✓ ') + colors.green.bold('SELECT THIS FOLDER') + colors.dim(` → ${currentPath}`),
        value: '__SELECT__',
      },
      {
        name: colors.yellow('⬆ ') + colors.yellow('Go to parent folder') + colors.dim(` → ${path.dirname(currentPath)}`),
        value: '__UP__',
      },
      new inquirer.Separator(colors.dim('  ── Subfolders ──')),
    ];

    entries.slice(0, 20).forEach(entry => {
      choices.push({
        name: colors.blue('  [+] ') + colors.white(entry),
        value: entry,
      });
    });

    if (entries.length > 20) {
      choices.push({
        name: colors.dim(`  ... and ${entries.length - 20} more folders`),
        value: '__MORE__',
        disabled: true,
      });
    }

    if (entries.length === 0) {
      choices.push({
        name: colors.dim('  (No subfolders)'),
        value: '__EMPTY__',
        disabled: true,
      });
    }

    const { folder } = await inquirer.prompt([
      {
        type: 'list',
        name: 'folder',
        message: colors.cyan('> Select folder:'),
        choices: choices,
        pageSize: 15,
      },
    ]);

    if (folder === '__SELECT__') {
      return currentPath;
    } else if (folder === '__UP__') {
      currentPath = path.dirname(currentPath);
    } else {
      currentPath = path.join(currentPath, folder);
    }
  }
}

// ═══════════════════════════════════════════════════
// API KEY VALIDATION
// ═══════════════════════════════════════════════════
function validateApiKey(apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (res.statusCode === 400 || res.statusCode === 403) {
          reject(new Error('Invalid API key. Please enter a correct key.'));
        } else {
          resolve(true);
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Connection error: ${err.message}`));
    });
  });
}

async function setupApiKey() {
  console.log();
  drawPremiumBox(
    colors.white('You need a Google Gemini API key to use Gemini Code.') + '\n' +
      colors.dim('You can get your API key from https://aistudio.google.com/apikey '),
    '[KEY] API Key Required',
    colors.yellow
  );
  console.log();

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: colors.yellow('> Gemini Enter your API Key:'),
      mask: '•',
      validate: (input) => {
        if (!input || input.trim().length < 10) {
          return colors.red('Enter a valid API key.');
        }
        return true;
      },
    },
  ]);

  const spinner = ora({
    text: colors.blue('Verifying API key...'),
    color: 'cyan',
    spinner: 'dots12',
  }).start();

  try {
    await validateApiKey(apiKey.trim());
    spinner.succeed(colors.green('> API key verified!'));
    // config.set('apiKey', apiKey.trim()); // Persistence Disabled
    return apiKey.trim();
  } catch (error) {
    spinner.fail(colors.red(`✗ ${error.message}`));
    console.log();
    return setupApiKey();
  }
}

// ═══════════════════════════════════════════════════
// MODEL SELECTION
// ═══════════════════════════════════════════════════
async function selectModel() {
  console.log();
  console.log(colors.blue.bold('  > Model Selection'));
  console.log(colors.dim('  ─────────────────────────────────────'));
  console.log();

  const choices = MODELS.map((m) => ({
    name: `  ${m.icon}  ${colors.white.bold(m.name)} ${getTierBadge(m.tier)}\n      ${colors.dim(m.description)}`,
    value: m.value,
    short: m.name,
  }));

  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: colors.blue('> Select the model you want to use:'),
      choices: choices,
      default: config.get('selectedModel'),
      pageSize: 14,
      loop: true,
    },
  ]);

  config.set('selectedModel', model);
  console.log(colors.green(`  > Model selected: ${getModelDisplayName(model)}`));
  return model;
}

// ═══════════════════════════════════════════════════
// CONTEXT BUILDER - reads project files for AI context
// ═══════════════════════════════════════════════════
function buildProjectContext() {
  const cwd = process.cwd();
  let context = `\n=== PROJECT STRUCTURE (${cwd}) ===\n`;
  
  try {
    const files = listProjectFiles(cwd, 0, 3);
    context += files.join('\n') + '\n';
  } catch (e) {
    context += '(could not read folder)\n';
  }
  
  return context;
}

function listProjectFiles(dirPath, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return [];
  
  try {
    const entries = fs.readdirSync(dirPath);
    let files = [];
    
    entries.forEach(entry => {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === '__pycache__' || entry === '.git') return;
      
      const fullPath = path.join(dirPath, entry);
      try {
        const stat = fs.statSync(fullPath);
        const indent = '  '.repeat(depth);
        if (stat.isDirectory()) {
          files.push(`${indent}[DIR] ${entry}/`);
          files = files.concat(listProjectFiles(fullPath, depth + 1, maxDepth));
        } else {
          const size = (stat.size / 1024).toFixed(1);
          files.push(`${indent}[FILE] ${entry} (${size}KB)`);
        }
      } catch(e) {}
    });
    
    return files;
  } catch(e) {
    return [`  ✗ Could not read: ${e.message}`];
  }
}

// ═══════════════════════════════════════════════════
// CHAT ENGINE with Retry Logic + AGENTIC CAPABILITIES
// ═══════════════════════════════════════════════════
class GeminiChatEngine {
  constructor(apiKey, modelId, projectFolder) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelId = modelId;
    this.history = [];
    this.projectFolder = projectFolder || process.cwd();
    this.buildSystemPrompt();
    this._initModel();
  }

  buildSystemPrompt() {
    this.systemPrompt = `[SYS]
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
Current Workspace: ${this.projectFolder}
${buildProjectContext()}`;
  }

  _initModel() {
    this.model = this.genAI.getGenerativeModel({
      model: this.modelId,
      systemInstruction: this.systemPrompt,
    });
    
    this.chat = this.model.startChat({
      history: this.history.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0.7,
      },
    });
  }

  async sendMessage(message, retryCount = 0) {
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
        process.stdout.write(colors.yellow(`\r  [!] Rate limit - ${waitSec}s bekleniyor...`));
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
        throw new Error(`Model "${this.modelId}" bulunamadı. /model ile başka bir model seçin.`);
      }
      throw new Error(`API Hatası: ${errMsg.substring(0, 200)}`);
    }
  }

  switchModel(newModelId) {
    this.modelId = newModelId;
    this._initModel();
  }

  resetChat() {
    this.history = [];
    this.buildSystemPrompt();
    this._initModel();
  }
  
  refreshContext() {
    this.buildSystemPrompt();
    this._initModel();
  }
}

// ═══════════════════════════════════════════════════
// RESPONSE FORMATTER
// ═══════════════════════════════════════════════════
function formatResponse(text) {
  // Remove action blocks from display (they are executed separately)
  let display = text
    .replace(/<<<FILE_CREATE:[\s\S]*?<<<END_FILE>>>/g, '')
    .replace(/<<<FILE_EDIT:[\s\S]*?<<<END_FILE>>>/g, '')
    .replace(/<<<FILE_DELETE:.+?>>>/g, '')
    .replace(/<<<TERMINAL:[\s\S]*?>>>/g, '');

  // Format code blocks
  display = display.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const header = lang
      ? colors.blueBg(` ${lang.toUpperCase()} `) + '\n'
      : '';
    const formatted = code
      .split('\n')
      .map((line) => colors.dim('  │ ') + colors.green(line))
      .join('\n');
    return '\n' + header + colors.dim('  ┌─────────────────────') + '\n' + formatted + '\n' + colors.dim('  └─────────────────────') + '\n';
  });

  // Format inline code
  display = display.replace(/`([^`]+)`/g, (match, code) => {
    return colors.yellow.bold(code);
  });

  // Format bold
  display = display.replace(/\*\*([^*]+)\*\*/g, (match, bold) => {
    return chalk.bold(bold);
  });

  // Format headers
  display = display.replace(/^### (.+)$/gm, (match, header) => {
    return colors.blue.bold('   ▸ ' + header);
  });
  display = display.replace(/^## (.+)$/gm, (match, header) => {
    return colors.green.bold('  ◆ ' + header);
  });
  display = display.replace(/^# (.+)$/gm, (match, header) => {
    return colors.blue.bold('━━━ ' + header + ' ━━━');
  });

  // Format bullet points
  display = display.replace(/^[•\-\*] (.+)$/gm, (match, item) => {
    return colors.yellow('  > ') + item;
  });

  // Format numbered lists
  display = display.replace(/^(\d+)\. (.+)$/gm, (match, num, item) => {
    return colors.yellow.bold(`  ${num}.`) + ' ' + item;
  });

  return display.trim();
}

// ═══════════════════════════════════════════════════
// COMMAND HANDLER
// ═══════════════════════════════════════════════════
async function handleCommand(cmd, engine) {
  const command = cmd.toLowerCase().trim();

  switch (command) {
    case '/help':
      console.log();
      drawPremiumBox(
        colors.yellow.bold('Sohbet Komutlari:') + '\n' +
          colors.yellow('/model    ') + colors.white('- Model seçimini değiştir') + '\n' +
          colors.yellow('/apikey   ') + colors.white('- API anahtarını değiştir') + '\n' +
          colors.yellow('/folder   ') + colors.white('- Proje folderünü değiştir') + '\n' +
          colors.yellow('/clear    ') + colors.white('- Sohbet geçmişini temizle') + '\n' +
          colors.yellow('/info     ') + colors.white('- Mevcut oturum bilgileri') + '\n' +
          colors.yellow('/models   ') + colors.white('- Tüm modelleri listele') + '\n' +
          colors.yellow('/files    ') + colors.white('- Proje dosyalarını listele') + '\n' +
          colors.yellow('/exec CMD ') + colors.white('- Terminal komutu çalıştır') + '\n' +
          colors.yellow('/read FILE') + colors.white('- Dosya içeriğini oku') + '\n' +
          colors.yellow('/write    ') + colors.white('- Dosya yaz (yol ve içerik sor)') + '\n' +
          colors.yellow('/tree     ') + colors.white('- Klasör ağacını göster') + '\n' +
          colors.yellow('/autoexec ') + colors.white('- AI eylem otomatik çalıştırma aç/kapat') + '\n' +
          colors.yellow('/refresh  ') + colors.white('- Proje bağlamını yenile') + '\n' +
          colors.yellow('/reset    ') + colors.white('- API anahtarını sıfırla') + '\n' +
          colors.yellow('/exit     ') + colors.white('- Programdan çık') + '\n\n' +
          colors.cyan.bold('Ajantik Format (AI tarafindan otomatik kullanilir):') + '\n' +
          colors.dim('<<<FILE_CREATE: yol>>>  içerik  <<<END_FILE>>>') + '\n' +
          colors.dim('<<<FILE_EDIT: yol>>>    içerik  <<<END_FILE>>>') + '\n' +
          colors.dim('<<<FILE_DELETE: yol>>>') + '\n' +
          colors.dim('<<<TERMINAL: komut>>>'),
        'Yardim',
        colors.blue
      );
      console.log();
      return true;

    case '/model':
      const newModel = await selectModel();
      engine.switchModel(newModel);
      console.log(colors.green(`  > Model degistirildi: ${getModelDisplayName(newModel)}`));
      return true;

    case '/apikey':
      const newKey = await setupApiKey();
      engine.apiKey = newKey;
      engine.genAI = new GoogleGenerativeAI(newKey);
      engine.switchModel(engine.modelId);
      console.log(colors.green('  > API anahtari guncellendi ve model yeniden baslatildi.'));
      return true;

    case '/folder':
      await selectProjectFolder();
      engine.projectFolder = process.cwd();
      engine.refreshContext();
      return true;

    case '/clear':
      engine.resetChat();
      console.log(colors.green('  > Sohbet gecmisi temizlendi.'));
      return true;

    case '/refresh':
      engine.refreshContext();
      console.log(colors.green('  > Proje baglami yenilendi: ' + process.cwd()));
      return true;

    case '/reset':
      config.clear();
      console.log(colors.green('  > Tum ayarlar sifirlandi. Program yeniden baslatilacak.'));
      console.log(colors.dim('  Programı tekrar başlatın.'));
      process.exit(0);

    case '/autoexec':
      const current = config.get('autoExec');
      config.set('autoExec', !current);
      console.log(
        !current
          ? colors.green('  > Otomatik çalıştırma ON — AI eylemleri anında uygulanır.')
          : colors.yellow('  > Otomatik çalıştırma OFF — AI eylemleri sadece gösterilir.')
      );
      return true;

    case '/info':
      console.log();
      const modelInfo = MODELS.find(m => m.value === engine.modelId);
      const autoExecStatus = config.get('autoExec') ? colors.greenBg(' ON ') : colors.redBg(' OFF ');
      drawPremiumBox(
        colors.white('Model    : ') + colors.blue.bold(getModelDisplayName(engine.modelId)) + '\n' +
          colors.white('Model ID : ') + colors.dim(engine.modelId) + '\n' +
          colors.white('Tier     : ') + (modelInfo ? getTierBadge(modelInfo.tier) : 'unknown') + '\n' +
          colors.white('Mesajlar : ') + colors.yellow.bold(String(engine.history.length / 2)) + '\n' +
          colors.white('Proje    : ') + colors.green(process.cwd()) + '\n' +
          colors.white('Oto.Exec : ') + autoExecStatus + '\n' +
          colors.white('Node     : ') + colors.dim(process.version) + '\n' +
          colors.white('Platform : ') + colors.dim(process.platform + ' ' + process.arch),
        'Oturum Bilgileri',
        colors.green
      );
      console.log();
      return true;

    case '/models':
      console.log();
      console.log(colors.blue.bold('  > Mevcut Modeller'));
      console.log(colors.dim('  ─────────────────────────────────────'));
      console.log();
      MODELS.forEach((m) => {
        const active = m.value === engine.modelId ? colors.green(' ◄ AKTİF') : '';
        console.log(`  ${m.icon}  ${colors.white.bold(m.name)} ${getTierBadge(m.tier)}${active}`);
        console.log(`      ${colors.dim(m.description)} ${colors.dim(`(${m.value})`)}`);
        console.log();
      });
      return true;

    case '/files':
    case '/tree':
      console.log();
      console.log(colors.cyan.bold(`  > Proje Dosyalari - ${process.cwd()}`));
      console.log(colors.dim('  ─────────────────────────────────────'));
      const files = listProjectFiles(process.cwd());
      files.forEach(f => console.log('  ' + f));
      if (files.length === 0) {
        console.log(colors.dim('  (Boş folder)'));
      }
      console.log();
      return true;

    case '/write':
      const { writePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'writePath',
          message: colors.cyan('> Dosya yolunu girin:'),
          validate: (input) => input.trim().length > 0 ? true : 'Bir yol girin.',
        },
      ]);
      
      console.log(colors.dim('  Dosya içeriğini girin (bitirmek için "---END---" yazın):'));
      
      let writeContent = '';
      const writeRl = readline.createInterface({ input: process.stdin, output: process.stdout });
      
      await new Promise((resolve) => {
        writeRl.on('line', (line) => {
          if (line.trim() === '---END---') {
            writeRl.close();
            resolve();
            return;
          }
          writeContent += line + '\n';
        });
        writeRl.on('close', () => resolve());
      });
      
      await executeActions([{ type: 'file_create', filePath: writePath.trim(), content: writeContent }]);
      return true;

    case '/exit':
    case '/quit':
    case '/q':
      console.log();
      console.log(colors.blue('  > Gemini Code sonlandiriliyor...'));
      console.log(colors.dim('  Tekrar gorusmek uzere!'));
      console.log();
      process.exit(0);

    default:
      if (command.startsWith('/exec ')) {
        const shellCmd = cmd.slice(6).trim();
        await executeActions([{ type: 'terminal', command: shellCmd }]);
        return true;
      }

      if (command.startsWith('/read ')) {
        const filePath = cmd.slice(6).trim();
        try {
          const absPath = path.resolve(filePath);
          if (!fs.existsSync(absPath)) {
            console.log(colors.red(`  ✗ Dosya bulunamadı: ${absPath}`));
            return true;
          }
          const stat = fs.statSync(absPath);
          if (stat.size > 1024 * 1024) {
            console.log(colors.red('  ✗ Dosya çok büyük (>1MB). Daha küçük bir dosya seçin.'));
            return true;
          }
          const content = fs.readFileSync(absPath, 'utf-8');
          console.log(colors.dim(`  > Dosya: ${absPath} (${(stat.size / 1024).toFixed(1)}KB)`));
          console.log(colors.dim('  ─────────────────────'));
          console.log(colors.green(content));
        } catch (err) {
          console.log(colors.red(`  ✗ Dosya okunamadı: ${err.message}`));
        }
        return true;
      }

      if (command.startsWith('/')) {
        console.log(colors.yellow(`  ⚠ Bilinmeyen komut: ${command}`));
        console.log(colors.dim('  /help yazarak tüm commandsı görebilirsiniz.'));
        return true;
      }

      return false;
  }
}

// ═══════════════════════════════════════════════════
// STATUS LINE
// ═══════════════════════════════════════════════════
function getStatusLine(modelId, msgCount) {
  const modelName = MODELS.find((m) => m.value === modelId)?.name || modelId;
  const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const autoTag = config.get('autoExec') ? colors.greenBg(' AUTO ') : colors.dim('[manual]');
  return (
    colors.dim('  ') +
    colors.yellowBg(' GEMINI ') +
    colors.dim(' ') +
    colors.greenBg(` ${modelName} `) +
    colors.dim(' ') +
    autoTag +
    colors.dim(' ') +
    colors.dim(`[${msgCount}]`) +
    colors.dim(` | ${now}`) +
    colors.dim(` | ${path.basename(process.cwd())}`)
  );
}

// ═══════════════════════════════════════════════════
// ACTION SUMMARY DISPLAY
// ═══════════════════════════════════════════════════
function displayActionSummary(actions) {
  if (actions.length === 0) return;
  
  console.log();
  console.log(colors.purpleBg(' ⚡ AJAN EYLEMLERI '));
  console.log(colors.dim('  ─────────────────────────────────────'));
  
  actions.forEach(action => {
    if (action.type === 'file_create') {
      console.log(colors.green(`  [+] DOSYA OLUŞTURULACAK: `) + colors.white(action.filePath));
    } else if (action.type === 'file_edit') {
      console.log(colors.yellow(`  [~] DOSYA DÜZENLENECEk: `) + colors.white(action.filePath));
    } else if (action.type === 'file_delete') {
      console.log(colors.red(`  [-] DOSYA SİLİNECEK: `) + colors.white(action.filePath));
    } else if (action.type === 'terminal') {
      console.log(colors.cyan(`  [>] KOMUT: `) + colors.white(action.command));
    }
  });
}

// ═══════════════════════════════════════════════════
// MAIN REPL
// ═══════════════════════════════════════════════════
async function startREPL(apiKey, modelId) {
  const engine = new GeminiChatEngine(apiKey, modelId, process.cwd());

  console.log();
  console.log(getStatusLine(modelId, 0));
  console.log(colors.dim('  ─────────────────────────────────────────────────'));
  console.log(
    colors.dim('  ') +
      colors.blue('/help') +
      colors.dim(' commands | ') +
      colors.blue('/model') +
      colors.dim(' model | ') +
      colors.blue('/folder') +
      colors.dim(' folder | ') +
      colors.blue('/autoexec') +
      colors.dim(' auto-run: ') +
      (config.get('autoExec') ? colors.green('ON') : colors.red('OFF'))
  );
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
    terminal: true,
  });

  function showPrompt() {
    const prompt =
      colors.blue('  ') +
      colors.blue.bold('> ') +
      colors.white.bold('');
    process.stdout.write(prompt);
  }

  let msgCount = 0;
  let isProcessing = false;
  showPrompt();

  rl.on('line', async (input) => {
    if (isProcessing) return;
    
    const trimmed = input.trim();
    if (!trimmed) {
      showPrompt();
      return;
    }

    // Handle commands
    if (trimmed.startsWith('/')) {
      isProcessing = true;
      const handled = await handleCommand(trimmed, engine);
      isProcessing = false;
      if (handled) {
        showPrompt();
        return;
      }
    }

    // Send message to Gemini
    isProcessing = true;
    console.log();
    
    const spinner = ora({
      text: colors.blue('Gemini is thinking...'),
      color: 'cyan',
      spinner: 'dots12',
      prefixText: '  ',
    }).start();

    try {
      const response = await engine.sendMessage(trimmed);
      spinner.stop();

      // Parse agentic actions from response
      const actions = parseAgentActions(response);
      
      // Display AI response header  
      console.log(colors.blue.bold('  Gemini'));
      console.log(colors.dim('  ─────────────────────'));
      
      const formatted = formatResponse(response);
      if (formatted.trim()) {
        const lines = formatted.split('\n');
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
      spinner.fail(colors.red(`  ✗ ${error.message}`));
      console.log(colors.dim('  Hint: try a different model with /model or wait a minute.'));
      console.log();
    }

    isProcessing = false;
    showPrompt();
  });

  rl.on('close', () => {
    console.log();
    console.log(colors.blue('  See you later!'));
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log();
    console.log(colors.blue('  Gemini Code terminated.'));
    process.exit(0);
  });
}

// ═══════════════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════════════
async function showWelcome() {
  clearScreen();
  console.log();
  
  const termWidth = process.stdout.columns || 80;
  const kurucuText = 'Creator: Ahmetenesssssss';
  const padding = Math.max(0, termWidth - kurucuText.length - 2);
  console.log(' '.repeat(padding) + colors.cyan.bold(kurucuText));
  console.log();
  
  drawLogo();
  console.log();
  console.log(
    colors.dim('  ') +
      getGradientText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  );
  console.log(
    colors.dim('  ') +
      colors.white('Full Agentic Terminal AI powered by Google DeepMind\'s Gemini API')
  );
  console.log(
    colors.dim('  ') +
      colors.blue('◆') + ' ' +
      colors.green('File Management') + colors.dim(' · ') +
      colors.yellow('Terminal Control') + colors.dim(' · ') +
      colors.red('Full Automation') +
      colors.dim('  v0.1.0') +
      colors.dim('  |  ') +
      colors.cyan('Creator: Ahmetenesssssss')
  );
  console.log(
    colors.dim('  ') +
      getGradientText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  );
  console.log();
}

// ═══════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════
async function main() {
  try {
    await showWelcome();

    // Step 1: Get API Key
    let apiKey = ''; // Always ask per session
    if (!apiKey) {
      apiKey = await setupApiKey();
    } else {
      console.log(colors.green('  > Saved API key found.'));
      console.log(colors.dim('  Type /apikey to change API key.'));
    }

    // Step 2: Select Project Folder
    const isFirstRun = !config.get('hasRunBefore');
    if (isFirstRun || !config.get('projectFolder')) {
      await selectProjectFolder();
    } else {
      const savedFolder = config.get('projectFolder');
      if (savedFolder && fs.existsSync(savedFolder)) {
        process.chdir(savedFolder);
        console.log(colors.dim('  ') + colors.white('Project folder: ') + colors.cyan(savedFolder));
        console.log(colors.dim('  Type /folder to change directory.'));
      } else {
        await selectProjectFolder();
      }
    }

    // Step 3: Select Model  
    let selectedModel = config.get('selectedModel');

    if (isFirstRun) {
      selectedModel = await selectModel();
      config.set('hasRunBefore', true);
      // Enable autoexec by default
      config.set('autoExec', true);
    } else {
      console.log(
        colors.dim('  ') +
          colors.white('Current model: ') +
          colors.blue.bold(getModelDisplayName(selectedModel))
      );
      console.log(colors.dim('  Type /model to change model.'));
      
      // Show autoexec status
      const autoExec = config.get('autoExec');
      console.log(
        colors.dim('  ') +
          colors.white('Auto-run: ') +
          (autoExec ? colors.green('ON') : colors.red('OFF')) +
          colors.dim(' (/autoexec to toggle)')
      );
    }

    // Step 4: Start REPL
    await startREPL(apiKey, selectedModel);
  } catch (error) {
    console.error(colors.red(`\n  [!] Critical error: ${error.message}`));
    process.exit(1);
  }
}

// Run
main();
