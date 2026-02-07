import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createRoom } from './commands/createRoom';
import { joinRoom } from './commands/joinRoom';
import { CodeExecutor } from './executor';
import { ContestRoom, Question } from './types';

// Import JavaScript modules for competitive coding features
const hackerrank = require('./hackerrank.js');
const randomProblem = require('./randomProblem.js');
const { runTests } = require('./testRunner.js');
const testGenerator = require('./testGenerator.js');

let currentPanel: vscode.WebviewPanel | undefined;
let currentRoom: ContestRoom | undefined;
let currentQuestion: Question | undefined;
let currentProblemData: any = null;
let currentProblemUrl: string | null = null;
const executor = new CodeExecutor();

export function activate(context: vscode.ExtensionContext) {
  console.log('DSA Contest Rooms extension activated');

  // Contest Mode Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.createRoom', async () => {
      currentRoom = await createRoom(context);
      if (currentRoom && currentRoom.questions.length > 0) {
        currentQuestion = currentRoom.questions[0];
        
        // Ask if user wants to start now
        const action = await vscode.window.showInformationMessage(
          `Room created! Code: ${currentRoom.id}`,
          'Start Contest Now',
          'Copy Room Code',
          'Cancel'
        );

        if (action === 'Copy Room Code') {
          vscode.env.clipboard.writeText(currentRoom.id);
          vscode.window.showInformationMessage('Room code copied! Share with participants.');
          
          // Ask again if they want to start
          const startAction = await vscode.window.showInformationMessage(
            'Ready to start the contest?',
            'Start Contest',
            'Wait'
          );
          
          if (startAction === 'Start Contest') {
            startContest(context);
          }
        } else if (action === 'Start Contest Now') {
          startContest(context);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.joinRoom', async () => {
      currentRoom = await joinRoom();
      if (currentRoom && currentRoom.questions.length > 0) {
        currentQuestion = currentRoom.questions[0];
        
        vscode.window.showInformationMessage(
          `Joined contest with ${currentRoom.questions.length} questions. Waiting for host to start...`
        );
        
        // Show webview in waiting state
        showWebview(context);
      } else if (currentRoom === undefined) {
        vscode.window.showWarningMessage('Could not join room. Please check the room code.');
      }
    })
  );

  // Add Start Contest command
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.startContest', () => {
      if (!currentRoom) {
        vscode.window.showErrorMessage('No active room. Create or join a room first.');
        return;
      }
      startContest(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.runCode', async () => {
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
      } catch (error: any) {
        vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
      }
    })
  );

  // Competitive Coding Commands
  
  // Fetch Random Problem
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.fetchRandomProblem', async () => {
      try {
        const categories = randomProblem.getCategories();
        const category = await vscode.window.showQuickPick(categories, {
          placeHolder: 'Select problem category'
        });

        if (!category) return;

        vscode.window.showInformationMessage('Fetching random problem...');

        const problem = await randomProblem.getRandomProblem(category);
        vscode.window.showInformationMessage(`Found: ${problem.title} (${problem.difficulty})`);

        const problemData = await hackerrank.fetchProblem(problem.url);
        currentProblemData = problemData;
        currentProblemUrl = problem.url;

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
          const action = await vscode.window.showErrorMessage(
            'No folder is open. Please open a folder first (File > Open Folder)',
            'Help'
          );
          if (action === 'Help') {
            vscode.window.showInformationMessage('Go to File menu > Open Folder, then select or create a folder for your coding problems');
          }
          return;
        }

        const problemFolder = path.join(workspaceFolder, problemData.id);
        await fs.mkdir(problemFolder, { recursive: true });

        await fs.writeFile(
          path.join(problemFolder, 'problem.json'),
          JSON.stringify(problemData, null, 2)
        );

        await fs.writeFile(
          path.join(problemFolder, 'testcases.json'),
          JSON.stringify(problemData.testCases, null, 2)
        );

        const solutionPath = path.join(problemFolder, `solution.${problemData.language || 'cpp'}`);
        await fs.writeFile(solutionPath, problemData.template || '');

        const doc = await vscode.workspace.openTextDocument(solutionPath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Problem ready: ${problemData.title}`);
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    })
  );

  // Fetch Problem by URL
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.fetchProblem', async () => {
      const problemUrl = await vscode.window.showInputBox({
        prompt: 'Enter HackerRank problem URL',
        placeHolder: 'https://www.hackerrank.com/challenges/...'
      });

      if (!problemUrl) return;

      try {
        vscode.window.showInformationMessage('Fetching problem from HackerRank...');
        
        const problemData = await hackerrank.fetchProblem(problemUrl);
        currentProblemData = problemData;
        currentProblemUrl = problemUrl;

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
          const action = await vscode.window.showErrorMessage(
            'No folder is open. Please open a folder first (File > Open Folder)',
            'Help'
          );
          if (action === 'Help') {
            vscode.window.showInformationMessage('Go to File menu > Open Folder, then select or create a folder for your coding problems');
          }
          return;
        }

        const problemFolder = path.join(workspaceFolder, problemData.id);
        await fs.mkdir(problemFolder, { recursive: true });

        await fs.writeFile(
          path.join(problemFolder, 'problem.json'),
          JSON.stringify(problemData, null, 2)
        );

        await fs.writeFile(
          path.join(problemFolder, 'testcases.json'),
          JSON.stringify(problemData.testCases, null, 2)
        );

        const solutionPath = path.join(problemFolder, `solution.${problemData.language || 'cpp'}`);
        await fs.writeFile(solutionPath, problemData.template || '');

        const doc = await vscode.workspace.openTextDocument(solutionPath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Problem fetched: ${problemData.title}`);
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    })
  );

  // Run Sample Tests
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.runTests', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      try {
        await editor.document.save();

        const solutionPath = editor.document.fileName;
        const problemFolder = path.dirname(solutionPath);
        const testCasesPath = path.join(problemFolder, 'testcases.json');

        let testCases;
        try {
          const testCasesData = await fs.readFile(testCasesPath, 'utf8');
          testCases = JSON.parse(testCasesData);
        } catch (error) {
          vscode.window.showErrorMessage('Test cases not found. Please fetch the problem first.');
          return;
        }

        vscode.window.showInformationMessage('Running tests...');

        const results = await runTests(solutionPath, testCases);

        if (results.passed === results.total) {
          vscode.window.showInformationMessage(`✓ All tests passed (${results.passed}/${results.total})`);
        } else {
          vscode.window.showWarningMessage(`${results.passed}/${results.total} tests passed`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error running tests: ${error.message}`);
      }
    })
  );

  // Generate and Run More Tests
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.generateTests', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      try {
        await editor.document.save();

        const solutionPath = editor.document.fileName;
        const problemFolder = path.dirname(solutionPath);
        const problemDataPath = path.join(problemFolder, 'problem.json');
        const testCasesPath = path.join(problemFolder, 'testcases.json');

        let problemData;
        try {
          const problemDataJson = await fs.readFile(problemDataPath, 'utf8');
          problemData = JSON.parse(problemDataJson);
        } catch (error) {
          vscode.window.showErrorMessage('Problem data not found.');
          return;
        }

        let existingTests = [];
        try {
          const testCasesData = await fs.readFile(testCasesPath, 'utf8');
          existingTests = JSON.parse(testCasesData);
        } catch (error) {
          // No existing tests
        }

        vscode.window.showInformationMessage('Generating additional test cases...');

        const generatedTests = testGenerator.generateTestCases(problemData, 5);
        const allTests = [...existingTests, ...generatedTests];

        await fs.writeFile(testCasesPath, JSON.stringify(allTests, null, 2));

        vscode.window.showInformationMessage(`Running ${allTests.length} tests (${generatedTests.length} generated)...`);

        const results = await runTests(solutionPath, allTests);

        if (results.passed === results.total) {
          vscode.window.showInformationMessage(`✓ All ${results.total} tests passed!`);
        } else {
          vscode.window.showWarningMessage(`${results.passed}/${results.total} tests passed`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    })
  );

  // Submit Solution
  context.subscriptions.push(
    vscode.commands.registerCommand('dsaRoom.submitSolution', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      try {
        await editor.document.save();

        let problemUrl = currentProblemUrl;
        
        if (!problemUrl) {
          const problemFolder = path.dirname(editor.document.fileName);
          const problemDataPath = path.join(problemFolder, 'problem.json');
          
          try {
            const problemDataJson = await fs.readFile(problemDataPath, 'utf8');
            const problemData = JSON.parse(problemDataJson);
            
            if (problemData.id) {
              problemUrl = `https://www.hackerrank.com/challenges/${problemData.id}/problem`;
            }
          } catch (error) {
            // Couldn't load problem data
          }
        }

        if (!problemUrl) {
          const input = await vscode.window.showInputBox({
            prompt: 'Enter problem URL',
            placeHolder: 'https://www.hackerrank.com/challenges/...'
          });
          problemUrl = input || null;
        }

        if (!problemUrl) return;

        const code = editor.document.getText();
        await vscode.env.clipboard.writeText(code);

        let submitUrl = problemUrl.replace('/problem', '/submissions/code');

        await vscode.env.openExternal(vscode.Uri.parse(submitUrl));
        
        vscode.window.showInformationMessage('✓ Code copied to clipboard! Opening submission page in browser...');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    })
  );
}

function startContest(context: vscode.ExtensionContext) {
  if (!currentRoom) return;
  
  // Update room status
  currentRoom.status = 'active';
  currentRoom.startTime = Date.now();
  
  // Show webview with contest
  showWebview(context);
  
  vscode.window.showInformationMessage(
    `Contest started! Duration: ${Math.floor(currentRoom.duration / 60000)} minutes`
  );
  
  // Set timer to end contest
  setTimeout(() => {
    endContest(context);
  }, currentRoom.duration);
}

function endContest(context: vscode.ExtensionContext) {
  if (!currentRoom) return;
  
  currentRoom.status = 'ended';
  
  vscode.window.showInformationMessage(
    'Contest ended! Calculating results...',
    'View Results'
  ).then(action => {
    if (action === 'View Results') {
      showResults(context);
    }
  });
}

function showResults(context: vscode.ExtensionContext) {
  if (!currentPanel) {
    currentPanel = vscode.window.createWebviewPanel(
      'dsaResults',
      'Contest Results',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
  }
  
  currentPanel.webview.html = getResultsHtml();
}

function getResultsHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contest Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 40px;
    }
    .results-container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      color: var(--vscode-textLink-foreground);
      margin-bottom: 40px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
    }
    .stat-label {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
    }
    .message {
      text-align: center;
      font-size: 18px;
      padding: 30px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="results-container">
    <h1>🏆 Contest Completed!</h1>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${currentRoom?.questions.length || 0}</div>
        <div class="stat-label">Problems</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.floor((currentRoom?.duration || 0) / 60000)}</div>
        <div class="stat-label">Minutes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${currentRoom?.participants?.length || 1}</div>
        <div class="stat-label">Participants</div>
      </div>
    </div>
    <div class="message">
      <p>Thank you for participating!</p>
      <p>Check your solutions and compare with others.</p>
    </div>
  </div>
</body>
</html>`;
}

function showWebview(context: vscode.ExtensionContext) {
  const needsCreate = !currentPanel;
  
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Two);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'dsaContest',
      'DSA Contest',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    });

    // Handle messages from webview
    currentPanel.webview.onDidReceiveMessage(
      async message => {
        switch (message.type) {
          case 'RUN_CODE':
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage('Please open a code file in the editor');
              return;
            }

            const code = editor.document.getText();
            
            try {
              const result = await executor.execute(
                message.payload.language,
                code,
                message.payload.testCases
              );
              
              currentPanel?.webview.postMessage({
                type: 'RUN_RESULT',
                payload: result
              });
            } catch (error: any) {
              vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
            }
            break;
          
          case 'COPY_ROOM_CODE':
            vscode.env.clipboard.writeText(message.payload.roomCode);
            vscode.window.showInformationMessage('Room code copied to clipboard!');
            break;
            
          case 'WEBVIEW_READY':
            // Webview is ready, send data now
            if (currentQuestion && currentRoom && currentPanel) {
              currentPanel.webview.postMessage({
                type: 'LOAD_QUESTION',
                payload: {
                  question: currentQuestion,
                  contestEndTime: currentRoom.startTime + currentRoom.duration,
                  roomId: currentRoom.id
                }
              });
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    // Set HTML content
    const cssPath = currentPanel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview', 'styles.css'))
    );
    const jsPath = currentPanel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview', 'app.js'))
    );

    currentPanel.webview.html = getWebviewContent(cssPath, jsPath);
  }

  // Send question data with delay to ensure webview is ready
  setTimeout(() => {
    if (currentQuestion && currentRoom && currentPanel) {
      currentPanel.webview.postMessage({
        type: 'LOAD_QUESTION',
        payload: {
          question: currentQuestion,
          contestEndTime: currentRoom.startTime + currentRoom.duration,
          roomId: currentRoom.id
        }
      });
    }
  }, needsCreate ? 500 : 100); // Longer delay if creating new panel
}

function getWebviewContent(cssUri: vscode.Uri, jsUri: vscode.Uri): string {
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
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-size: 18px;
    }
    .loading-spinner {
      border: 4px solid var(--vscode-panel-border);
      border-top: 4px solid var(--vscode-textLink-foreground);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .container { padding: 20px; max-width: 1200px; margin: 0 auto; display: none; }
    .container.loaded { display: block; }
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
      overflow-y: auto;
      max-height: calc(100vh - 200px);
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
  <div class="loading" id="loadingScreen">
    <div class="loading-spinner"></div>
    <div>Loading Contest Room...</div>
  </div>
  <div class="container" id="contestContainer">
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

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'WEBVIEW_READY' });

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
      // Hide loading, show content
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('contestContainer').classList.add('loaded');
      
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

export function deactivate() {}
