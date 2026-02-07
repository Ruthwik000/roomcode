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
const vscode = __importStar(require("vscode"));
const Ably = __importStar(require("ably"));
const config_1 = require("../config");
let ablyClient = null;
async function joinRoom() {
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
        if (!ablyClient && config_1.config.ablyApiKey) {
            ablyClient = new Ably.Realtime(config_1.config.ablyApiKey);
        }
        if (!ablyClient) {
            vscode.window.showErrorMessage('Ably API key not configured');
            return undefined;
        }
        const channel = ablyClient.channels.get(`contest-${roomId}`);
        return new Promise((resolve, reject) => {
            // Listen for room data
            channel.subscribe('room-created', (message) => {
                const room = message.data;
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
    }
    catch (error) {
        vscode.window.showErrorMessage('Failed to join room: ' + error.message);
        return undefined;
    }
}
//# sourceMappingURL=joinRoom.js.map