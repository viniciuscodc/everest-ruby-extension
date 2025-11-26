import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerNewClassCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'everest-ruby.newClass',
        async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('No folder selected');
                return;
            }

            const className = await vscode.window.showInputBox({
                prompt: 'Enter class name'
            });
            if (!className) return;

            const workSpacePath = getWorkspacePath()
            if (!workSpacePath) return;

            const fileName = pascalToSnakeCase(className)

            const targetPath = fs.existsSync(uri.fsPath) && fs.lstatSync(uri.fsPath).isDirectory()
                ? path.join(uri.fsPath, fileName)
                : path.join(path.dirname(uri.fsPath), fileName);

            const namespace = getRailsNamespaceWildcard(targetPath + '.rb', workSpacePath);

            console.log("Namespace:", namespace);   

            fs.writeFileSync(targetPath, workSpacePath);

            vscode.window.showInformationMessage(`Created file: ${fileName}`);
        }
    );
    
    context.subscriptions.push(disposable);
}

const pascalToSnakeCase = (text: string): string => {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') 
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
};

function snakeToPascalCase(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const getWorkspacePath = (): string | null => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace open");
        return null;
    }

    return workspaceFolders[0].uri.fsPath;
};

function getRailsNamespaceWildcard(filePath: string, workspaceRoot: string): string | null {
  const normalizedFile = path.normalize(filePath);
  const appRoot = path.join(workspaceRoot, 'app');

  if (!normalizedFile.startsWith(appRoot)) {
    return null;
  }

  // Remove "/root/app/"
  const relativeToApp = path.relative(appRoot, normalizedFile);

  // Split: [contexts, user_context, accounts, create.rb]
  const parts = relativeToApp.split(path.sep);

  if (parts.length < 3) {
    return null; // example: app/models/user.rb → ignore
  }

  // Remove app type folder (contexts/services/controllers/etc)
  const namespaceParts = parts.slice(1, -1); // remove "contexts" and file name

  if (namespaceParts.length === 0) {
    return null;
  }

  return namespaceParts
    .map(snakeToPascalCase)
    .join('::');
}
