import * as vscode from 'vscode';
import { ContestRoom, Question } from '../types';
import * as Ably from 'ably';
import { config } from '../config';

let ablyClient: Ably.Realtime | null = null;

export async function joinRoom(): Promise<ContestRoom | undefined> {
  const roomId = await vscode.window.showInputBox({
    prompt: 'Enter Room Code',
    placeHolder: 'room-1234567890',
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Room code cannot be empty';
      }
      return null;
    }
  });

  if (!roomId) {
    return undefined;
  }

  try {
    if (!ablyClient && config.ablyApiKey) {
      ablyClient = new Ably.Realtime(config.ablyApiKey);
    }

    if (!ablyClient) {
      vscode.window.showErrorMessage('Ably API key not configured');
      return undefined;
    }

    const channel = ablyClient.channels.get(`contest-${roomId}`);
    
    return new Promise((resolve, reject) => {
      // Listen for room data
      channel.subscribe('room-created', (message) => {
        const room = message.data as ContestRoom;
        vscode.window.showInformationMessage(`Successfully joined room: ${roomId}`);
        resolve(room);
      });

      // Request room data
      channel.publish('request-room-data', { roomId });

      // Timeout after 10 seconds
      setTimeout(() => {
        vscode.window.showErrorMessage('Room not found or connection timeout');
        resolve(undefined);
      }, 10000);
    });
  } catch (error) {
    vscode.window.showErrorMessage('Failed to join room: ' + (error as Error).message);
    return undefined;
  }
}
