import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { 
  pascalToSnakeCase, snakeToPascalCase, 
  generateNestedRubyModules, getRailsNamespaceWildcard, 
  getWorkspacePath} from '../lib/fileHandling';


export function registerNewTestCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'everest-ruby.newTest',
        async (uri: vscode.Uri) => {
            const sourcePath = uri.fsPath;

            const fileName = path.basename(sourcePath);
            const fileNameNoExt = path.basename(fileName, path.extname(fileName));
            const testFileName = `${fileNameNoExt}_spec.rb`;

            const workSpacePath = getWorkspacePath()
            if (!workSpacePath) return

            const test_dir = path.join(workSpacePath, 'spec')
            const source_dir = path.dirname(sourcePath)
            const fileDirRelativeWorkspace = path.relative(workSpacePath, source_dir)
            const fileDirRelativeWorkspaceWithoutApp = removeAppPrefix(fileDirRelativeWorkspace)
            const testTargetDir = path.join(test_dir, fileDirRelativeWorkspaceWithoutApp)
            const testFilePath = path.join(testTargetDir, testFileName)

            const namespace = getRailsNamespaceWildcard(sourcePath, workSpacePath)
            if (!namespace) return

            const initialContent = 
`RSpec.describe ${namespace + '::' + snakeToPascalCase(fileNameNoExt)} do
end`;
            const contentBytes = new TextEncoder().encode(initialContent);
            const testFileUri = vscode.Uri.file(testFilePath);

            try {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(testTargetDir));
                await vscode.workspace.fs.writeFile(testFileUri, contentBytes);

                const doc = await vscode.workspace.openTextDocument(testFileUri);
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage(`Test file created at: ${testFilePath}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(
                    `Failed to create test file: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    )
    
    context.subscriptions.push(disposable)
}

function removeAppPrefix(directory: string): string {
    const prefix = 'app/';

    if (directory.startsWith(prefix)) {
        return directory.substring(prefix.length) 
    }

    return directory
}