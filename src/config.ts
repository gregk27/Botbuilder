// To update the type declaration, run the command "json2ts ./resources/config.schema.json > ./src/.types/config.d.ts" from the project root
import { BotbuilderConfigSchema } from "src/.types/config";
import * as fs from "fs";
import * as vscode from "vscode";

interface ConfigData extends BotbuilderConfigSchema {
    workspaceRoot:string;
    resourcePath:string;
}


/**
 * Configuration file
 */
var config:ConfigData=null;

/**
 * Get the configuration data
 */
function getConfig(){
    return config;
}
export default getConfig;

/**
 * Load/reload the configuration file
 * @param workspaceRoot The root path of the workspace 
 * @param resPath The path to the extension resource folder
 */
export function loadConfig(workspaceRoot:string, resPath:string){
    let configPath = workspaceRoot + "/" + vscode.workspace.getConfiguration("ler-botbuilder").get("configPath");
    if(!fs.existsSync(configPath)){
        fs.copyFileSync(resPath+"/defaultConfig.json", configPath);
    }
    
    config = JSON.parse(fs.readFileSync(configPath).toString());
    config.workspaceRoot = workspaceRoot;
    config.resourcePath = resPath;
}