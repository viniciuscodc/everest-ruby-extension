import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { 
  pascalToSnakeCase, snakeToPascalCase, 
  generateNestedRubyModules, getRailsNamespaceWildcard, getWorkspacePath } from '../lib/fileHandling';

export function registerNewClassCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'everest-ruby.newClass',
        async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('No folder selected')
                return
            }

            const className = await vscode.window.showInputBox({
                prompt: 'Enter class name (ex: MyCoolClass)'
            })
            if (!className) return

            const workSpacePath = getWorkspacePath()
            if (!workSpacePath) return

            const fileName = pascalToSnakeCase(className)

            const targetPath = fs.existsSync(uri.fsPath) && fs.lstatSync(uri.fsPath).isDirectory()
                ? path.join(uri.fsPath, fileName)
                : path.join(path.dirname(uri.fsPath), fileName)
            const filePath = targetPath + '.rb'

            const namespace = getRailsNamespaceWildcard(filePath, workSpacePath)
            if (!namespace) return

            const initialContent = 
`class ${className}
end`;

            fs.writeFileSync(filePath, generateNestedRubyModules(namespace, initialContent))

            const testFileUri = vscode.Uri.file(filePath);
            const doc = await vscode.workspace.openTextDocument(testFileUri);
            await vscode.window.showTextDocument(doc);
        }
    )
    
    context.subscriptions.push(disposable)
}




