import * as vscode from 'vscode';
import { TreeType } from './treeType';
import { TreeElement, TreeElementBase, Field, Method } from './codeElements';
import { JavaBase, Scope } from './javaParser/common';
import { JavaField, JavaMethod, JavaElement } from './javaParser/JavaElements';

export class DataProvider implements vscode.TreeDataProvider<TreeElementBase> {
    
    constructor(private getter: ()=>TreeType[]){
        
    }

    private _onDidChangeTreeData: vscode.EventEmitter<TreeElementBase | undefined> = new vscode.EventEmitter<TreeElementBase | undefined>();
    onDidChangeTreeData?: vscode.Event<void | TreeElementBase>;
    
        
    public refresh(){
        this._onDidChangeTreeData.fire(null);
    }

    getTreeItem(element: TreeElementBase): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if(element instanceof Field || element instanceof Method){
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
    
    getChildren(element?: TreeElementBase): vscode.ProviderResult<TreeElementBase[]> {
        if (element instanceof TreeElement){      
            return element.children;
        } else {
            return this.getter();
        }
    }

    getParent?(element: TreeElementBase): vscode.ProviderResult<TreeElementBase> {
        throw new Error("Method not implemented.");
    }


}