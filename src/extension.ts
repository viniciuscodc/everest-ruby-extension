import * as vscode from 'vscode';
import { registerNewClassCommand } from './commands/newClass';
import { registerNewContextCommand } from './commands/newContext';
import { registerNewTestCommand } from './commands/newTest';

export function activate(context: vscode.ExtensionContext) {
	registerNewClassCommand(context)
	registerNewContextCommand(context)
	registerNewTestCommand(context)
}

export function deactivate() {}
