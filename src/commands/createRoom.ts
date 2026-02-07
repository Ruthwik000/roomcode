import * as vscode from 'vscode';
import * as Ably from 'ably';
import { ContestRoom, Question } from '../types';

const randomProblem = require('../randomProblem.js');
const hackerrank = require('../hackerrank.js');

let ablyClient: Ably.Realtime | null = null;

export async function createRoom(context: vscode.ExtensionContext): Promise<ContestRoom | undefined> {
  try {
    // Step 1: Check for Ably API key
    let ablyApiKey = process.env.ABLY_API_KEY;
    
    if (!ablyApiKey) {
      const action = await vscode.window.showWarningMessage(
        'Ably API key not found. You need an API key to create contest rooms.',
        'Enter API Key',
        'Get API Key',
        'Cancel'
      );

      if (action === 'Get API Key') {
        vscode.env.openExternal(vscode.Uri.parse('https://ably.com/signup'));
        vscode.window.showInformationMessage('After signing up, copy your API key and click "Enter API Key"');
        return undefined;
      }

      if (action === 'Enter API Key') {
        ablyApiKey = await vscode.window.showInputBox({
          prompt: 'Enter your Ably API Key',
          placeHolder: 'xxxxx.xxxxxx:xxxxxxxxxxxxxxxxxxxxxxxx',
          password: true,
          ignoreFocusOut: true
        });

        if (!ablyApiKey) {
          vscode.window.showErrorMessage('API key is required to create a room');
          return undefined;
        }

        // Save to .env file
        const envPath = vscode.Uri.joinPath(context.extensionUri, '.env');
        try {
          await vscode.workspace.fs.writeFile(
            envPath,
            Buffer.from(`ABLY_API_KEY=${ablyApiKey}\n`)
          );
          process.env.ABLY_API_KEY = ablyApiKey;
          vscode.window.showInformationMessage('API key saved! Creating room...');
        } catch (error) {
          vscode.window.showWarningMessage('Could not save API key to .env file, but will use it for this session');
        }
      } else {
        return undefined;
      }
    }

    // Step 2: Select topic/difficulty
    const categories = randomProblem.getCategories();
    const category = await vscode.window.showQuickPick(categories, {
      placeHolder: 'Select problem category for the contest',
      ignoreFocusOut: true
    });

    if (!category) return undefined;

    // Step 3: Select number of problems
    const numProblems = await vscode.window.showQuickPick(
      ['1', '2', '3', '4', '5'],
      {
        placeHolder: 'How many problems for this contest?',
        ignoreFocusOut: true
      }
    );

    if (!numProblems) return undefined;

    // Step 4: Fetch random problems
    vscode.window.showInformationMessage(`Fetching ${numProblems} random problems...`);
    
    const questions: Question[] = [];
    const problemCount = parseInt(numProblems);

    for (let i = 0; i < problemCount; i++) {
      try {
        const problem = await randomProblem.getRandomProblem(category);
        const problemData = await hackerrank.fetchProblem(problem.url);
        
        questions.push({
          id: problemData.id,
          title: problemData.title,
          description: problemData.description,
          difficulty: problemData.difficulty || 'Medium',
          language: 'cpp',
          testCases: problemData.testCases.map((tc: any) => ({
            input: tc.input,
            output: tc.output
          })),
          timeLimit: 2000,
          memoryLimit: 256
        });

        vscode.window.showInformationMessage(`Fetched ${i + 1}/${problemCount}: ${problemData.title}`);
      } catch (error: any) {
        vscode.window.showWarningMessage(`Failed to fetch problem ${i + 1}: ${error.message}`);
      }
    }

    if (questions.length === 0) {
      vscode.window.showErrorMessage('Failed to fetch any problems. Please try again.');
      return undefined;
    }

    // Step 5: Select time limit
    const timeLimitStr = await vscode.window.showQuickPick(
      ['30 minutes', '60 minutes', '90 minutes', '120 minutes', 'Custom'],
      {
        placeHolder: 'Select contest duration',
        ignoreFocusOut: true
      }
    );

    if (!timeLimitStr) return undefined;

    let duration: number;
    if (timeLimitStr === 'Custom') {
      const customTime = await vscode.window.showInputBox({
        prompt: 'Enter duration in minutes',
        placeHolder: '60',
        validateInput: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num <= 0) {
            return 'Please enter a valid positive number';
          }
          return null;
        }
      });
      if (!customTime) return undefined;
      duration = parseInt(customTime) * 60 * 1000;
    } else {
      duration = parseInt(timeLimitStr) * 60 * 1000;
    }

    // Step 6: Generate room code
    const roomId = generateRoomCode();

    // Step 7: Initialize Ably
    try {
      ablyClient = new Ably.Realtime(ablyApiKey!);
      
      const channel = ablyClient.channels.get(`contest-room-${roomId}`);
      
      // Publish room data
      await channel.publish('room-created', {
        roomId,
        questions,
        duration,
        createdAt: Date.now()
      });

      vscode.window.showInformationMessage(
        `Contest room created! Room Code: ${roomId}`,
        'Copy Room Code'
      ).then(action => {
        if (action === 'Copy Room Code') {
          vscode.env.clipboard.writeText(roomId);
          vscode.window.showInformationMessage('Room code copied to clipboard!');
        }
      });

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to create Ably room: ${error.message}`);
      // Continue without Ably for local use
    }

    // Step 8: Create room object
    const room: ContestRoom = {
      id: roomId,
      questions,
      participants: [],
      startTime: Date.now(),
      duration,
      status: 'waiting' // Will start when user clicks "Start Contest"
    };

    return room;

  } catch (error: any) {
    vscode.window.showErrorMessage(`Error creating room: ${error.message}`);
    return undefined;
  }
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getAblyClient(): Ably.Realtime | null {
  return ablyClient;
}
