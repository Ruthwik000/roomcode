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
exports.createRoom = createRoom;
const vscode = __importStar(require("vscode"));
const mockData_1 = require("../mockData");
const Ably = __importStar(require("ably"));
const config_1 = require("../config");
let ablyClient = null;
async function createRoom(context) {
    const roomId = `room-${Date.now()}`;
    const duration = 60 * 60 * 1000; // 1 hour
    // Select questions
    const selectedQuestions = await vscode.window.showQuickPick(mockData_1.mockQuestions.map(q => ({ label: q.title, description: q.difficulty, question: q })), { canPickMany: true, placeHolder: 'Select questions for the contest' });
    if (!selectedQuestions || selectedQuestions.length === 0) {
        return undefined;
    }
    const room = {
        id: roomId,
        questions: selectedQuestions.map(s => s.question),
        startTime: Date.now(),
        duration
    };
    // Initialize Ably (optional - for future room sync)
    try {
        if (!ablyClient && config_1.config.ablyApiKey) {
            ablyClient = new Ably.Realtime(config_1.config.ablyApiKey);
        }
        if (ablyClient) {
            const channel = ablyClient.channels.get(`contest-${roomId}`);
            await channel.publish('room-created', room);
        }
    }
    catch (error) {
        console.log('Ably not configured, skipping sync');
    }
    // Show room code prominently
    vscode.window.showInformationMessage(`Contest room created! Room Code: ${roomId}`, 'Copy Room Code').then(selection => {
        if (selection === 'Copy Room Code') {
            vscode.env.clipboard.writeText(roomId);
            vscode.window.showInformationMessage('Room code copied to clipboard!');
        }
    });
    return room;
}
//# sourceMappingURL=createRoom.js.map