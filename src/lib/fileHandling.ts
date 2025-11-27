import * as path from 'path'
import * as vscode from 'vscode'

export const pascalToSnakeCase = (text: string): string => {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') 
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

export function snakeToPascalCase(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

export function generateNestedRubyModules(namespace: string, innerContent: string = ""): string {
  const modules = namespace.split('::');
  let rubyCode = "";
  let indentationLevel = 0;
  
  rubyCode += '# typed: true\n'
  modules.forEach(moduleName => {
    const indentation = "  ".repeat(indentationLevel);
    rubyCode += `${indentation}module ${moduleName}\n`;
    indentationLevel++;
  });
  
  if (innerContent.trim()) {
    const contentIndentation = "  ".repeat(indentationLevel);
    
    const lines = innerContent.split('\n');
    let minIndent = Infinity;
    
    lines.forEach(line => {
        if (line.trim().length > 0) {
            const leadingSpaces = line.match(/^(\s*)/)?.[0].length ?? 0;
            if (leadingSpaces < minIndent) {
                minIndent = leadingSpaces;
            }
        }
    });
    
    if (minIndent === Infinity) minIndent = 0;

    const indentedContent = lines
        .map(line => {
            const normalizedLine = line.substring(minIndent);
            
            return `${contentIndentation}${normalizedLine}`;
        })
        .join('\n');
        
    rubyCode += `${indentedContent}\n`;
  } else {
    rubyCode += "\n";
  }
  
  for (let i = modules.length - 1; i >= 0; i--) {
    indentationLevel--;
    const indentation = "  ".repeat(indentationLevel);
    rubyCode += `${indentation}end\n`;
  }
  
  return rubyCode;
}

export function getRailsNamespaceWildcard(filePath: string, workspaceRoot: string): string | null {
  const normalizedFile = path.normalize(filePath)
  const appRoot = path.join(workspaceRoot, 'app')

  if (!normalizedFile.startsWith(appRoot)) {
    return null
  }

  const relativeToApp = path.relative(appRoot, normalizedFile)

  const parts = relativeToApp.split(path.sep)

  if (parts.length < 3) {
    return null
  }

  const namespaceParts = parts.slice(1, -1)

  if (namespaceParts.length === 0) {
    return null
  }

  return namespaceParts
    .map(snakeToPascalCase)
    .join('::')
}

export const getWorkspacePath = (): string | null => {
    const workspaceFolders = vscode.workspace.workspaceFolders

    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace open")
        return null
    }

    return workspaceFolders[0].uri.fsPath
}