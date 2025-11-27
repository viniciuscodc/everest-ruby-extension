import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { 
  snakeToPascalCase, 
  generateNestedRubyModules, getRailsNamespaceWildcard, 
  getWorkspacePath} from '../lib/fileHandling';

export function registerNewContextCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'everest-ruby.newContext',
        async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('No folder selected')
                return
            }

            const contextName = await vscode.window.showInputBox({
                prompt: 'Enter context name (ex: merchant_context)'
            })
            if (!contextName) return

            const normalizedContext = contextName.replace('_context', '')
            const contextPath = uri.fsPath + '/' + contextName

            const interfaceNamespace = createInterface(contextPath, normalizedContext)
            if (!interfaceNamespace) return
            createUseCase(contextPath, interfaceNamespace)
            createRepository(contextPath, normalizedContext, interfaceNamespace)
            
            vscode.window.showInformationMessage(`Created context: ${contextName}`)
        }
    )
    
    context.subscriptions.push(disposable)
}

function createInterface(contextRootPath: string, contextName: string) : string | undefined {
    const code = 
`module ${snakeToPascalCase(contextName)}Repository
  extend T::Sig
  extend T::Helpers
  interface!

  sig { abstract.params(merchant_id: Integer).returns(T::Array[Integer])}
  def list_payments(merchant_id); end
  sig { abstract.void }
  def new; end
end`;

    const interfaceDir = path.join(contextRootPath, 'application', 'repositories');
    const fileName = contextName + '_repository.rb'
    
    fs.mkdirSync(interfaceDir, { recursive: true });
    
    const filePath = path.join(interfaceDir, fileName);

    const workSpacePath = getWorkspacePath();
    if (!workSpacePath) return;

    const namespace = getRailsNamespaceWildcard(filePath, workSpacePath);
    if (!namespace) {
      vscode.window.showErrorMessage('Failed to get everest workspace. Open vscode folder on everest root.');
      return
    }

    fs.writeFileSync(filePath, generateNestedRubyModules(namespace, code));
    return namespace
}

function createUseCase(contextRootPath: string, interfaceNamespace: string) {
    const code = 
`class ListPayments
  extend T::Sig

  Repository = ${interfaceNamespace}

  sig { params(repository: Repository).void }
  def initialize(repository)
    @repository = repository.new
  end

  sig { params(merchant_id: Integer).returns(T::Array[Integer])}
  def call(merchant_id)
    @repository.list_payments(merchant_id)
  end
end`;

    const interfaceDir = path.join(contextRootPath, 'application', 'use_cases');
    const fileName = 'list_payments.rb'
    
    fs.mkdirSync(interfaceDir, { recursive: true });
    
    const filePath = path.join(interfaceDir, fileName);

    const workSpacePath = getWorkspacePath();
    if (!workSpacePath) return;

    const namespace = getRailsNamespaceWildcard(filePath, workSpacePath);
    if (!namespace) return;

    fs.writeFileSync(filePath, generateNestedRubyModules(namespace, code));
}

function createRepository(contextRootPath: string, contextName: string, interfaceNamespace: string) {
    const code = 
`class ${snakeToPascalCase(contextName)}ActiveRecordRepository
  extend T::Sig
  include ${interfaceNamespace}

  sig { override.params(merchant_id: Integer).returns(T::Array[Integer]) }
  def list_payments(merchant_id)
end`;

    const interfaceDir = path.join(contextRootPath, 'infrastructure', 'repositories');
    const fileName = contextName + '_active_record_repository.rb'
    
    fs.mkdirSync(interfaceDir, { recursive: true });
    
    const filePath = path.join(interfaceDir, fileName);

    const workSpacePath = getWorkspacePath();
    if (!workSpacePath) return;

    const namespace = getRailsNamespaceWildcard(filePath, workSpacePath);
    if (!namespace) return;

    fs.writeFileSync(filePath, generateNestedRubyModules(namespace, code));
}
