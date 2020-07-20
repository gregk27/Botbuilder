import * as vscode from 'vscode';
import { TreeType } from './treeType';
import { TreeElement } from './codeElements';
import { JavaElement, Scope } from './javaParser/interfaces';

export class DataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    constructor(private getter: ()=>TreeType[]){
        
    }

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    onDidChangeTreeData?: vscode.Event<void | vscode.TreeItem | null | undefined> | undefined  = this._onDidChangeTreeData.event;
    
    public refresh(){
        this._onDidChangeTreeData.fire(null);
    }
    
    getTreeItem(element: TreeElement | vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if(element instanceof vscode.TreeItem){
            return element;
        } else if(element instanceof JavaElement){
            if((<JavaElement> element).scope === Scope.PUBLIC || ((<JavaElement> element).isStatic && (<JavaElement> element).isFinal)){
                return TreeElement.getTreeItem(element);
            } else {
                return null;
            }
        } else {
            return TreeElement.getTreeItem(element);
        }
    }
    getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if(element instanceof TreeType){
            console.log("TREETYPE ==============================================");
            console.log(element.name);
            console.log(element.children);
            return element.children;
        } else if (element !== undefined && 'children' in element){      
            console.log("NOTTREETYPE ==============================================");
            return (<TreeElement> element).children;
        } else {
            return this.getter();
        }
    }

}