"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const createRoom_1 = require("./commands/createRoom");
const joinRoom_1 = require("./commands/joinRoom");
const executor_1 = require("./executor");
let currentPanel;
let currentRoom;
let currentQuestion;
const executor = new executor_1.CodeExecutor();
function activate(context) {
    console.log('DSA Contest Rooms extension activated');
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('dsaRoom.createRoom', async () => {
        currentRoom = await (0, createRoom_1.createRoom)(context);
        if (currentRoom && currentRoom.questions.length > 0) {
            currentQuestion = currentRoom.questions[0];
            showWebview(context);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('dsaRoom.joinRoom', async () => {
        currentRoom = await (0, joinRoom_1.joinRoom)();
        if (currentRoom && currentRoom.questions.length > 0) {
            currentQuestion = currentRoom.questions[0];
            showWebview(context);
            vscode.window.showInformationMessage(`Joined contest with ${currentRoom.questions.length} questions`);
        }
        else if (currentRoom === undefined) {
            vscode.window.showWarningMessage('Could not join room. Please check the room code.');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('dsaRoom.runCode', async () => {
        if (!currentQuestion) {
            vscode.window.showErrorMessage('No active question');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        const code = editor.document.getText();
        const language = currentQuestion.language;
        try {
            const result = await executor.execute(language, code, currentQuestion.testCases);
            if (currentPanel) {
                currentPanel.webview.postMessage({
                    type: 'RUN_RESULT',
                    payload: result
                });
            }
            vscode.window.showInformationMessage(`Verdict: ${result.verdict}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
        }
    }));
}
function showWebview(context) {
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Two);
    }
    else {
        currentPanel = vscode.window.createWebviewPanel('dsaContest', 'DSA Contest', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });
        // Handle messages from webview
        currentPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'RUN_CODE':
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage('Please open a code file in the editor');
                        return;
                    }
                    const code = editor.document.getText();
                    try {
                        const result = await executor.execute(message.payload.language, code, message.payload.testCases);
                        currentPanel?.webview.postMessage({
                            type: 'RUN_RESULT',
                            payload: result
                        });
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
                    }
                    break;
                case 'COPY_ROOM_CODE':
                    vscode.env.clipboard.writeText(message.payload.roomCode);
                    vscode.window.showInformationMessage('Room code copied to clipboard!');
                    break;
            }
        }, undefined, context.subscriptions);
    }
    // Load HTML content
    const htmlPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview', 'index.html'));
    const cssPath = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview', 'styles.css')));
    const jsPath = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview', 'app.js')));
    currentPanel.webview.html = getWebviewContent(cssPath, jsPath);
    // Send question data
    if (currentQuestion && currentRoom) {
        currentPanel.webview.postMessage({
            type: 'LOAD_QUESTION',
            payload: {
                question: currentQuestion,
                contestEndTime: currentRoom.startTime + currentRoom.duration,
                roomId: currentRoom.id
            }
        });
    }
}
function getWebviewContent(cssUri, jsUri) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DSA Contest</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .room-code {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
      margin-top: 5px;
    }
    .room-code span {
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      font-family: monospace;
      font-size: 16px;
    }
    .copy-btn {
      margin-left: 10px;
      padding: 4px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    .copy-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .timer { font-size: 18px; font-weight: bold; color: var(--vscode-textLink-foreground); }
    .content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .question-panel, .code-panel {
      padding: 15px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }
    .difficulty {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .difficulty.Easy { background: #00b894; color: white; }
    .difficulty.Medium { background: #fdcb6e; color: black; }
    .difficulty.Hard { background: #d63031; color: white; }
    .description { white-space: pre-wrap; line-height: 1.6; }
    .controls { display: flex; gap: 10px; margin-bottom: 15px; }
    #languageSelect {
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }
    #runButton {
      padding: 8px 20px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    #runButton:hover { background: var(--vscode-button-hoverBackground); }
    #runButton:disabled { opacity: 0.5; cursor: not-allowed; }
    .verdict-banner {
      padding: 12px;
      margin-bottom: 15px;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
      display: none;
    }
    .verdict-banner.show { display: block; }
    .verdict-banner.Accepted { background: #00b894; color: white; }
    .verdict-banner.WrongAnswer { background: #d63031; color: white; }
    .verdict-banner.RuntimeError { background: #e17055; color: white; }
    .verdict-banner.TimeLimitExceeded { background: #fdcb6e; color: black; }
    .results-panel h3 { margin-top: 0; }
    .test-result {
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
      border-left: 4px solid;
    }
    .test-result.Passed { border-color: #00b894; background: rgba(0, 184, 148, 0.1); }
    .test-result.Failed { border-color: #d63031; background: rgba(214, 48, 49, 0.1); }
    .test-result-details { font-size: 12px; margin-top: 5px; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 id="questionTitle">Loading...</h1>
        <div class="room-code" id="roomCode" style="display: none;">
          Room Code: <span id="roomCodeValue"></span>
          <button id="copyRoomCode" class="copy-btn">Copy</button>
        </div>
      </div>
      <div class="timer" id="timer">Time: 00:00:00</div>
    </div>
    <div class="content">
      <div class="question-panel">
        <div class="difficulty" id="difficulty"></div>
        <div class="description" id="description"></div>
      </div>
      <div class="code-panel">
        <div class="controls">
          <select id="languageSelect">
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          <button id="runButton">Run Code</button>
        </div>
        <div class="verdict-banner" id="verdictBanner"></div>
        <div class="results-panel" id="resultsPanel">
          <h3>Test Results</h3>
          <div id="testResults"></div>
        </div>
      </div>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    let currentQuestion = null;
    let contestEndTime = null;

    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'LOAD_QUESTION':
          loadQuestion(message.payload);
          break;
        case 'RUN_RESULT':
          displayResults(message.payload);
          break;
      }
    });

    function loadQuestion(data) {
      currentQuestion = data.question;
      contestEndTime = data.contestEndTime;
      document.getElementById('questionTitle').textContent = currentQuestion.title;
      document.getElementById('difficulty').textContent = currentQuestion.difficulty;
      document.getElementById('difficulty').className = 'difficulty ' + currentQuestion.difficulty;
      document.getElementById('description').textContent = currentQuestion.description;
      document.getElementById('languageSelect').value = currentQuestion.language;
      
      // Show room code if available
      if (data.roomId) {
        document.getElementById('roomCodeValue').textContent = data.roomId;
        document.getElementById('roomCode').style.display = 'block';
      }
      
      startTimer();
    }

    // Copy room code functionality
    document.getElementById('copyRoomCode').addEventListener('click', () => {
      const roomCode = document.getElementById('roomCodeValue').textContent;
      vscode.postMessage({
        type: 'COPY_ROOM_CODE',
        payload: { roomCode }
      });
    });

    function startTimer() {
      setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, contestEndTime - now);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timer').textContent = 
          'Time: ' + String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        if (remaining === 0) {
          document.getElementById('runButton').disabled = true;
          document.getElementById('timer').textContent = 'Contest Ended';
        }
      }, 1000);
    }

    document.getElementById('runButton').addEventListener('click', () => {
      const button = document.getElementById('runButton');
      button.disabled = true;
      button.textContent = 'Running...';
      document.getElementById('verdictBanner').className = 'verdict-banner';
      document.getElementById('testResults').innerHTML = '';
      vscode.postMessage({
        type: 'RUN_CODE',
        payload: {
          language: document.getElementById('languageSelect').value,
          testCases: currentQuestion.testCases
        }
      });
    });

    function displayResults(result) {
      const button = document.getElementById('runButton');
      button.disabled = false;
      button.textContent = 'Run Code';
      const banner = document.getElementById('verdictBanner');
      banner.textContent = result.verdict;
      banner.className = 'verdict-banner show ' + result.verdict.replace(' ', '');
      const resultsContainer = document.getElementById('testResults');
      result.results.forEach(test => {
        const div = document.createElement('div');
        div.className = 'test-result ' + (test.status === 'Passed' ? 'Passed' : 'Failed');
        div.innerHTML = '<strong>Test ' + test.test + ':</strong> ' + test.status +
          (test.expected ? '<div class="test-result-details">Expected: ' + test.expected + '<br>Got: ' + test.actual + '</div>' : '');
        resultsContainer.appendChild(div);
      });
    }
  </script>
</body>
</html>`;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map