const vscode = require('vscode');
const atcoder = require('./src/atcoder');
const hackerrank = require('./src/hackerrank');
const randomProblem = require('./src/randomProblem');
const testGenerator = require('./src/testGenerator');
const ProblemViewProvider = require('./src/webview');
const { runTests } = require('./src/testRunner');
const path = require('path');
const fs = require('fs').promises;

let currentProblemData = null;
let currentProblemUrl = null;

function activate(context) {
    console.log('Competitive Coding Helper is now active');

    // Register webview provider
    const provider = new ProblemViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('competitiveCodingView', provider)
    );

    // Fetch Random Problem Command
    let fetchRandomCommand = vscode.commands.registerCommand('competitiveCoding.fetchRandomProblem', async () => {
        try {
            // Select category
            const categories = randomProblem.getCategories();
            const category = await vscode.window.showQuickPick(categories, {
                placeHolder: 'Select problem category'
            });

            if (!category) return;

            vscode.window.showInformationMessage('Fetching random problem...');

            // Get random problem
            const problem = await randomProblem.getRandomProblem(category);

            vscode.window.showInformationMessage(`Found: ${problem.title} (${problem.difficulty})`);

            // Fetch full problem details
            const problemData = await hackerrank.fetchProblem(problem.url);

            // Store current problem data
            currentProblemData = problemData;
            currentProblemUrl = problem.url;

            // Update webview
            provider.updateProblem(problemData);

            // Create workspace folder for problem
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

            // Save problem data
            const problemDataPath = path.join(problemFolder, 'problem.json');
            await fs.writeFile(problemDataPath, JSON.stringify(problemData, null, 2));

            // Save test cases
            const testCasesPath = path.join(problemFolder, 'testcases.json');
            await fs.writeFile(testCasesPath, JSON.stringify(problemData.testCases, null, 2));

            // Create solution template
            const solutionPath = path.join(problemFolder, `solution.${problemData.language || 'cpp'}`);
            await fs.writeFile(solutionPath, problemData.template || '');

            // Open solution file
            const doc = await vscode.workspace.openTextDocument(solutionPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`Problem ready: ${problemData.title}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Fetch Problem from UI Command
    let fetchFromUICommand = vscode.commands.registerCommand('competitiveCoding.fetchProblemFromUI', async (platform, problemUrl) => {
        try {
            vscode.window.showInformationMessage('Fetching problem from HackerRank...');
            
            // Always use HackerRank
            const problemData = await hackerrank.fetchProblem(problemUrl);

            // Store current problem data
            currentProblemData = problemData;
            currentProblemUrl = problemUrl;

            // Update webview
            provider.updateProblem(problemData);

            // Create workspace folder for problem
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

            // Save problem data
            const problemDataPath = path.join(problemFolder, 'problem.json');
            await fs.writeFile(problemDataPath, JSON.stringify(problemData, null, 2));

            // Save test cases
            const testCasesPath = path.join(problemFolder, 'testcases.json');
            await fs.writeFile(testCasesPath, JSON.stringify(problemData.testCases, null, 2));

            // Create solution template
            const solutionPath = path.join(problemFolder, `solution.${problemData.language || 'cpp'}`);
            await fs.writeFile(solutionPath, problemData.template || '');

            // Open solution file
            const doc = await vscode.workspace.openTextDocument(solutionPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`Problem fetched: ${problemData.title}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Fetch Problem Command (legacy)
    let fetchCommand = vscode.commands.registerCommand('competitiveCoding.fetchProblem', async () => {
        const problemUrl = await vscode.window.showInputBox({
            prompt: 'Enter HackerRank problem URL',
            placeHolder: 'https://www.hackerrank.com/challenges/...'
        });

        if (!problemUrl) return;

        try {
            vscode.window.showInformationMessage('Fetching problem from HackerRank...');
            
            const problemData = await hackerrank.fetchProblem(problemUrl);

            // Store current problem data
            currentProblemData = problemData;
            currentProblemUrl = problemUrl;

            // Update webview
            provider.updateProblem(problemData);

            // Create workspace folder for problem
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

            // Save problem data
            const problemDataPath = path.join(problemFolder, 'problem.json');
            await fs.writeFile(problemDataPath, JSON.stringify(problemData, null, 2));

            // Save test cases
            const testCasesPath = path.join(problemFolder, 'testcases.json');
            await fs.writeFile(testCasesPath, JSON.stringify(problemData.testCases, null, 2));

            // Create solution template
            const solutionPath = path.join(problemFolder, `solution.${problemData.language || 'cpp'}`);
            await fs.writeFile(solutionPath, problemData.template || '');

            // Open solution file
            const doc = await vscode.workspace.openTextDocument(solutionPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`Problem fetched: ${problemData.title}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Run Tests Command
    let runTestsCommand = vscode.commands.registerCommand('competitiveCoding.runTests', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            // Save the file first
            await editor.document.save();

            const solutionPath = editor.document.fileName;
            const problemFolder = path.dirname(solutionPath);
            const testCasesPath = path.join(problemFolder, 'testcases.json');

            // Load test cases
            let testCases;
            try {
                const testCasesData = await fs.readFile(testCasesPath, 'utf8');
                testCases = JSON.parse(testCasesData);
            } catch (error) {
                vscode.window.showErrorMessage('Test cases not found. Please fetch the problem first.');
                return;
            }

            vscode.window.showInformationMessage('Running tests...');

            // Run tests
            const results = await runTests(solutionPath, testCases);

            // Update webview with results
            provider.updateTestResults(results);

            if (results.passed === results.total) {
                vscode.window.showInformationMessage(`✓ All tests passed (${results.passed}/${results.total})`);
            } else {
                vscode.window.showWarningMessage(`${results.passed}/${results.total} tests passed`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error running tests: ${error.message}`);
        }
    });

    // Generate and Run More Tests Command
    let generateTestsCommand = vscode.commands.registerCommand('competitiveCoding.generateTests', async () => {
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

            // Load problem data
            let problemData;
            try {
                const problemDataJson = await fs.readFile(problemDataPath, 'utf8');
                problemData = JSON.parse(problemDataJson);
            } catch (error) {
                vscode.window.showErrorMessage('Problem data not found.');
                return;
            }

            // Load existing test cases
            let existingTests = [];
            try {
                const testCasesData = await fs.readFile(testCasesPath, 'utf8');
                existingTests = JSON.parse(testCasesData);
            } catch (error) {
                // No existing tests
            }

            vscode.window.showInformationMessage('Generating additional test cases...');

            // Generate new test cases
            const generatedTests = testGenerator.generateTestCases(problemData, 5);
            const allTests = [...existingTests, ...generatedTests];

            // Save all tests
            await fs.writeFile(testCasesPath, JSON.stringify(allTests, null, 2));

            vscode.window.showInformationMessage(`Running ${allTests.length} tests (${generatedTests.length} generated)...`);

            // Run all tests
            const results = await runTests(solutionPath, allTests);

            // Update webview with results
            provider.updateTestResults(results);

            if (results.passed === results.total) {
                vscode.window.showInformationMessage(`✓ All ${results.total} tests passed!`);
            } else {
                vscode.window.showWarningMessage(`${results.passed}/${results.total} tests passed`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Submit Solution Command - Opens browser for submission
    let submitCommand = vscode.commands.registerCommand('competitiveCoding.submitSolution', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            // Save the file first
            await editor.document.save();

            // Get problem URL
            let problemUrl = currentProblemUrl;
            
            if (!problemUrl) {
                // Try to load from problem.json
                const problemFolder = path.dirname(editor.document.fileName);
                const problemDataPath = path.join(problemFolder, 'problem.json');
                
                try {
                    const problemDataJson = await fs.readFile(problemDataPath, 'utf8');
                    const problemData = JSON.parse(problemDataJson);
                    
                    // Construct URL from problem data
                    if (problemData.id) {
                        problemUrl = `https://www.hackerrank.com/challenges/${problemData.id}/problem`;
                    }
                } catch (error) {
                    // Couldn't load problem data
                }
            }

            if (!problemUrl) {
                problemUrl = await vscode.window.showInputBox({
                    prompt: 'Enter problem URL',
                    placeHolder: 'https://www.hackerrank.com/challenges/...'
                });
            }

            if (!problemUrl) return;

            // Copy code to clipboard
            const code = editor.document.getText();
            await vscode.env.clipboard.writeText(code);

            // Determine submit URL
            let submitUrl = problemUrl;
            if (problemUrl.includes('hackerrank.com')) {
                // Change /problem to /submissions/code
                submitUrl = problemUrl.replace('/problem', '/submissions/code');
            } else if (problemUrl.includes('atcoder.jp')) {
                // Extract contest and problem, construct submit URL
                const match = problemUrl.match(/contests\/([^\/]+)\/tasks\/([^\/]+)/);
                if (match) {
                    submitUrl = `https://atcoder.jp/contests/${match[1]}/submit`;
                }
            }

            // Open browser
            await vscode.env.openExternal(vscode.Uri.parse(submitUrl));
            
            vscode.window.showInformationMessage('✓ Code copied to clipboard! Opening submission page in browser...');
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Show Problem Command
    let showProblemCommand = vscode.commands.registerCommand('competitiveCoding.showProblem', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            const problemFolder = path.dirname(editor.document.fileName);
            const problemDataPath = path.join(problemFolder, 'problem.json');

            const problemDataJson = await fs.readFile(problemDataPath, 'utf8');
            const problemData = JSON.parse(problemDataJson);

            currentProblemData = problemData;
            provider.updateProblem(problemData);

            vscode.window.showInformationMessage('Problem loaded in sidebar');
        } catch (error) {
            vscode.window.showErrorMessage('Problem data not found. Please fetch the problem first.');
        }
    });

    context.subscriptions.push(fetchRandomCommand, fetchFromUICommand, fetchCommand, submitCommand, runTestsCommand, generateTestsCommand, showProblemCommand);
}

function getLanguageFromExtension(filename) {
    const ext = path.extname(filename);
    const langMap = {
        '.cpp': 'cpp',
        '.c': 'c',
        '.py': 'python',
        '.java': 'java',
        '.js': 'javascript',
        '.go': 'go',
        '.rs': 'rust'
    };
    return langMap[ext] || 'cpp';
}

function deactivate() {}

module.exports = { activate, deactivate };
