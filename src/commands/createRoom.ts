import * as vscode from 'vscode';
import { ContestRoom, Question } from '../types';
import { mockQuestions } from '../mockData';
import * as Ably from 'ably';
import { config } from '../config';

let ablyClient: Ably.Realtime | null = null;

export async function createRoom(context: vscode.ExtensionContext): Promise<ContestRoom | undefined> {
  const roomId = `room-${Date.now()}`;
  const duration = 60 * 60 * 1000; // 1 hour

  // Select questions
  const selectedQuestions = await vscode.window.showQuickPick(
    mockQuestions.map(q => ({ label: q.title, description: q.difficulty, question: q })),
    { canPickMany: true, placeHolder: 'Select questions for the contest' }
  );

  if (!selectedQuestions || selectedQuestions.length === 0) {
    return undefined;
  }

  const room: ContestRoom = {
    id: roomId,
    questions: selectedQuestions.map(s => s.question),
    startTime: Date.now(),
    duration
  };

  // Initialize Ably (optional - for future room sync)
  try {
    if (!ablyClient && config.ablyApiKey) {
      ablyClient = new Ably.Realtime(config.ablyApiKey);
    }
    if (ablyClient) {
      const channel = ablyClient.channels.get(`contest-${roomId}`);
      await channel.publish('room-created', room);
    }
  } catch (error) {
    console.log('Ably not configured, skipping sync');
  }

  // Show room code prominently
  vscode.window.showInformationMessage(
    `Contest room created! Room Code: ${roomId}`,
    'Copy Room Code'
  ).then(selection => {
    if (selection === 'Copy Room Code') {
      vscode.env.clipboard.writeText(roomId);
      vscode.window.showInformationMessage('Room code copied to clipboard!');
    }
  });
  
  return room;
}
