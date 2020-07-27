import * as vscode from 'vscode';
import { TreeType } from './treeType';
import { TreeElement } from './codeElements';
import { JavaBase, Scope } from './javaParser/common';
import { JavaField, JavaMethod, JavaElement } from './javaParser/JavaElements';

export class DataProvider implements vscode.TreeDataProvider<TreeElement<JavaBase>> {
    
    constructor(private getter: ()=>TreeType[]){
        
    }

    private _onDidChangeTreeData: vscode.EventEmitter<TreeElement<JavaBase> | undefined> = new vscode.EventEmitter<TreeElement<JavaBase> | undefined>();
    onDidChangeTreeData?: vscode.Event<void | TreeElement<JavaBase>>;
    
        
    public refresh(){
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: TreeElement<JavaBase>): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if(element instanceof JavaField || element instanceof JavaMethod){
            //Show public and/or static final fields and methods
            if(element.element.scope === Scope.PUBLIC || ((<JavaElement> element.element).isStatic && element.element.isFinal)){
                return TreeElement.getTreeItem(element);
            } else {
                return null;
            }
        } else {
            return TreeElement.getTreeItem(element);
        }    
    }
    
    getChildren(element?: TreeElement<JavaBase>): vscode.ProviderResult<TreeElement<JavaBase>[]> {
        if (element instanceof TreeElement){      
            return element.children;
        } else {
            return this.getter();
        }
    }

    getParent?(element: TreeElement<JavaBase>): vscode.ProviderResult<TreeElement<JavaBase>> {
        throw new Error("Method not implemented.");
    }


}