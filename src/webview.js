const vscode = require('vscode');

class ProblemViewProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._view = undefined;
        this.currentProblem = null;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'fetchProblem':
                    vscode.commands.executeCommand('competitiveCoding.fetchProblemFromUI', data.platform, data.url);
                    break;
                case 'fetchRandomProblem':
                    vscode.commands.executeCommand('competitiveCoding.fetchRandomProblem');
                    break;
                case 'runTest':
                    vscode.commands.executeCommand('competitiveCoding.runTests');
                    break;
                case 'generateTests':
                    vscode.commands.executeCommand('competitiveCoding.generateTests');
                    break;
                case 'submit':
                    vscode.commands.executeCommand('competitiveCoding.submitSolution');
                    break;
            }
        });
    }

    updateProblem(problemData) {
        this.currentProblem = problemData;
        if (this._view) {
            this._view.webview.postMessage({ type: 'updateProblem', problem: problemData });
        }
    }

    updateTestResults(results) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'testResults', results });
        }
    }

    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Problem Viewer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            padding: 20px;
            background: #000000;
            color: #ffffff;
            line-height: 1.6;
        }

        .fetch-form {
            background: #0a0a0a;
            padding: 20px;
            border: 1px solid #222222;
        }

        .form-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #ffffff;
            letter-spacing: 2px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 5px;
            color: #888888;
            letter-spacing: 1px;
        }

        .form-input {
            width: 100%;
            padding: 10px;
            background: #000000;
            border: 1px solid #333333;
            color: #ffffff;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            outline: none;
        }

        .form-input:focus {
            border-color: #555555;
        }

        .form-input::placeholder {
            color: #444444;
        }

        .btn-fetch {
            width: 100%;
            padding: 12px;
            background: #1a1a1a;
            border: 1px solid #333333;
            color: #ffffff;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            letter-spacing: 1px;
            margin-top: 10px;
        }

        .btn-fetch:hover {
            background: #2a2a2a;
            border-color: #555555;
        }

        .divider {
            height: 1px;
            background: #222222;
            margin: 30px 0;
        }

        .header {
            border-bottom: 1px solid #333333;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .title {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 10px;
        }

        .meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            font-size: 13px;
            color: #888888;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .section {
            margin-bottom: 25px;
            background: #0a0a0a;
            padding: 15px;
            border-radius: 0;
            border-left: 2px solid #333333;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #cccccc;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .section-content {
            font-size: 14px;
            white-space: pre-wrap;
            color: #aaaaaa;
        }

        .constraints-list {
            list-style: none;
            padding-left: 0;
        }

        .constraints-list li {
            padding: 5px 0;
            padding-left: 20px;
            position: relative;
            color: #aaaaaa;
        }

        .constraints-list li:before {
            content: ">";
            position: absolute;
            left: 0;
            color: #666666;
        }

        .test-case {
            background: #000000;
            padding: 12px;
            margin: 10px 0;
            border-radius: 0;
            border: 1px solid #222222;
        }

        .test-case-header {
            font-weight: 600;
            margin-bottom: 8px;
            color: #cccccc;
        }

        .test-io {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 8px;
        }

        .test-io-box {
            background: #0a0a0a;
            padding: 10px;
            border-radius: 0;
            border: 1px solid #222222;
        }

        .test-io-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666666;
            margin-bottom: 5px;
        }

        .test-io-content {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            white-space: pre;
            overflow-x: auto;
            color: #ffffff;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        button {
            flex: 1;
            padding: 10px 20px;
            border: 1px solid #333333;
            border-radius: 0;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }

        .btn-primary {
            background: #1a1a1a;
            color: #ffffff;
        }

        .btn-primary:hover {
            background: #2a2a2a;
            border-color: #555555;
        }

        .btn-secondary {
            background: #0a0a0a;
            color: #cccccc;
        }

        .btn-secondary:hover {
            background: #1a1a1a;
            border-color: #555555;
        }

        .test-results {
            margin-top: 20px;
        }

        .test-result {
            padding: 12px;
            margin: 8px 0;
            border-radius: 0;
            border-left: 3px solid;
            background: #0a0a0a;
        }

        .test-result.passed {
            border-color: #666666;
        }

        .test-result.failed {
            border-color: #444444;
        }

        .test-result-header {
            font-weight: 600;
            margin-bottom: 5px;
            color: #cccccc;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666666;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 15px;
            opacity: 0.3;
        }

        .empty-state-text {
            font-size: 16px;
            margin-bottom: 10px;
        }

        .empty-state-hint {
            font-size: 13px;
            opacity: 0.7;
        }

        code {
            background: #0a0a0a;
            padding: 2px 6px;
            border-radius: 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            color: #ffffff;
            border: 1px solid #222222;
        }

        .difficulty {
            padding: 4px 10px;
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #333333;
        }

        .difficulty.easy {
            background: #0a0a0a;
            color: #888888;
        }

        .difficulty.medium {
            background: #0a0a0a;
            color: #aaaaaa;
        }

        .difficulty.hard {
            background: #0a0a0a;
            color: #cccccc;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="fetch-form">
            <div class="form-title">FETCH PROBLEM</div>
            
            <div class="form-group">
                <label class="form-label">PLATFORM</label>
                <select id="platform" class="form-input">
                    <option value="AtCoder">AtCoder</option>
                    <option value="HackerRank">HackerRank</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">PROBLEM URL</label>
                <input type="text" id="problemUrl" class="form-input" placeholder="https://..." />
            </div>

            <button class="btn-fetch" onclick="fetchProblem()">FETCH PROBLEM</button>
            <button class="btn-fetch" onclick="fetchRandomProblem()">FETCH RANDOM PROBLEM</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentProblem = null;

        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'updateProblem':
                    currentProblem = message.problem;
                    renderProblem(message.problem);
                    break;
                case 'testResults':
                    renderTestResults(message.results);
                    break;
            }
        });

        function renderProblem(problem) {
            const app = document.getElementById('app');
            
            app.innerHTML = \`
                <div class="header">
                    <div class="title">\${problem.title || 'Untitled Problem'}</div>
                    <div class="meta">
                        <div class="meta-item">
                            <span>ID: \${problem.id}</span>
                        </div>
                        \${problem.difficulty ? \`<span class="difficulty \${problem.difficulty.toLowerCase()}">\${problem.difficulty}</span>\` : ''}
                        \${problem.timeLimit ? \`<div class="meta-item"><span>Time: \${problem.timeLimit}</span></div>\` : ''}
                        \${problem.memoryLimit ? \`<div class="meta-item"><span>Memory: \${problem.memoryLimit}</span></div>\` : ''}
                    </div>
                </div>

                \${problem.description ? \`
                <div class="section">
                    <div class="section-title">Problem Statement</div>
                    <div class="section-content">\${problem.description}</div>
                </div>
                \` : ''}

                \${problem.inputFormat ? \`
                <div class="section">
                    <div class="section-title">Input Format</div>
                    <div class="section-content">\${problem.inputFormat}</div>
                </div>
                \` : ''}

                \${problem.outputFormat ? \`
                <div class="section">
                    <div class="section-title">Output Format</div>
                    <div class="section-content">\${problem.outputFormat}</div>
                </div>
                \` : ''}

                \${problem.constraints ? \`
                <div class="section">
                    <div class="section-title">Constraints</div>
                    <div class="section-content">
                        <ul class="constraints-list">
                            \${problem.constraints.map(c => \`<li>\${c}</li>\`).join('')}
                        </ul>
                    </div>
                </div>
                \` : ''}

                \${problem.testCases && problem.testCases.length > 0 ? \`
                <div class="section">
                    <div class="section-title">Sample Test Cases</div>
                    \${problem.testCases.map((tc, i) => \`
                        <div class="test-case">
                            <div class="test-case-header">Test Case \${i + 1}</div>
                            <div class="test-io">
                                <div class="test-io-box">
                                    <div class="test-io-label">Input</div>
                                    <div class="test-io-content">\${tc.input}</div>
                                </div>
                                <div class="test-io-box">
                                    <div class="test-io-label">Expected Output</div>
                                    <div class="test-io-content">\${tc.output}</div>
                                </div>
                            </div>
                        </div>
                    \`).join('')}
                </div>
                \` : ''}

                <div class="button-group">
                    <button class="btn-primary" onclick="runTests()">Run Sample Tests</button>
                    <button class="btn-primary" onclick="generateTests()">Generate & Run More Tests</button>
                </div>
                <div class="button-group">
                    <button class="btn-secondary" onclick="submit()">Submit Solution</button>
                </div>

                <div id="test-results" class="test-results"></div>
            \`;
        }

        function renderTestResults(results) {
            const container = document.getElementById('test-results');
            if (!container) return;

            container.innerHTML = \`
                <div class="section">
                    <div class="section-title">Test Results (\${results.passed}/\${results.total} passed)</div>
                    \${results.details.map((result, i) => \`
                        <div class="test-result \${result.passed ? 'passed' : 'failed'}">
                            <div class="test-result-header">
                                [\${result.passed ? 'PASS' : 'FAIL'}] Test Case \${i + 1}
                                \${result.time ? \` - \${result.time}ms\` : ''}
                            </div>
                            \${!result.passed ? \`
                                <div style="margin-top: 8px; font-size: 13px; color: #aaaaaa;">
                                    <div><strong>Expected:</strong> <code>\${result.expected}</code></div>
                                    <div><strong>Got:</strong> <code>\${result.actual}</code></div>
                                </div>
                            \` : ''}
                        </div>
                    \`).join('')}
                </div>
            \`;
        }

        function fetchProblem() {
            const platform = document.getElementById('platform').value;
            const url = document.getElementById('problemUrl').value.trim();
            
            if (!url) {
                alert('Please enter a problem URL');
                return;
            }
            
            vscode.postMessage({ 
                type: 'fetchProblem', 
                platform: platform,
                url: url 
            });
        }

        function fetchRandomProblem() {
            vscode.postMessage({ type: 'fetchRandomProblem' });
        }

        function runTests() {
            vscode.postMessage({ type: 'runTest' });
        }

        function generateTests() {
            vscode.postMessage({ type: 'generateTests' });
        }

        function submit() {
            vscode.postMessage({ type: 'submit' });
        }
    </script>
</body>
</html>`;
    }
}

module.exports = ProblemViewProvider;
