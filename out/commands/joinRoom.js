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
exports.joinRoom = joinRoom;
exports.getAblyClient = getAblyClient;
const vscode = __importStar(require("vscode"));
const Ably = __importStar(require("ably"));
let ablyClient = null;
async function joinRoom() {
    try {
        // Step 1: Get room code
        const roomCode = await vscode.window.showInputBox({
            prompt: 'Enter the 6-digit room code',
            placeHolder: 'ABC123',
            validateInput: (value) => {
                if (!value || value.length !== 6) {
                    return 'Room code must be 6 characters';
                }
                return null;
            },
            ignoreFocusOut: true
        });
        if (!roomCode)
            return undefined;
        // Step 2: Check for Ably API key
        let ablyApiKey = process.env.ABLY_API_KEY;
        if (!ablyApiKey) {
            const action = await vscode.window.showWarningMessage('Ably API key not found. You need an API key to join contest rooms.', 'Enter API Key', 'Cancel');
            if (action === 'Enter API Key') {
                ablyApiKey = await vscode.window.showInputBox({
                    prompt: 'Enter your Ably API Key',
                    placeHolder: 'xxxxx.xxxxxx:xxxxxxxxxxxxxxxxxxxxxxxx',
                    password: true,
                    ignoreFocusOut: true
                });
                if (!ablyApiKey) {
                    vscode.window.showErrorMessage('API key is required to join a room');
                    return undefined;
                }
                process.env.ABLY_API_KEY = ablyApiKey;
            }
            else {
                return undefined;
            }
        }
        // Step 3: Connect to Ably and fetch room data
        vscode.window.showInformationMessage('Connecting to room...');
        try {
            ablyClient = new Ably.Realtime(ablyApiKey);
            const channel = ablyClient.channels.get(`contest-room-${roomCode.toUpperCase()}`);
            // Wait for room data
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    vscode.window.showErrorMessage('Room not found or connection timeout');
                    resolve(undefined);
                }, 10000);
                channel.subscribe('room-created', (message) => {
                    clearTimeout(timeout);
                    const roomData = message.data;
                    const room = {
                        id: roomData.roomId,
                        questions: roomData.questions,
                        participants: [],
                        startTime: roomData.createdAt,
                        duration: roomData.duration,
                        status: 'waiting'
                    };
                    vscode.window.showInformationMessage(`Joined room: ${roomCode.toUpperCase()}`);
                    resolve(room);
                });
                // Also try to get history
                channel.history({ limit: 1 }, (err, resultPage) => {
                    if (!err && resultPage && resultPage.items.length > 0) {
                        clearTimeout(timeout);
                        const message = resultPage.items[0];
                        const roomData = message.data;
                        const room = {
                            id: roomData.roomId,
                            questions: roomData.questions,
                            participants: [],
                            startTime: roomData.createdAt,
                            duration: roomData.duration,
                            status: 'waiting'
                        };
                        vscode.window.showInformationMessage(`Joined room: ${roomCode.toUpperCase()}`);
                        resolve(room);
                    }
                });
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to join room: ${error.message}`);
            return undefined;
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error joining room: ${error.message}`);
        return undefined;
    }
}
function getAblyClient() {
    return ablyClient;
}
//# sourceMappingURL=joinRoom.js.map