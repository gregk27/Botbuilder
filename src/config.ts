// To update the type declaration, run the command "json2ts ./resources/config.schema.json > ./src/.types/config.d.ts" from the project root
import { BotbuilderConfigSchema } from "src/.types/config";
import * as fs from "fs";
import * as vscode from "vscode";

interface ConfigData extends BotbuilderConfigSchema {
    workspaceRoot:string;
    resourcePath:string;
    /**
     * The package containing the base class as defined in the config file
     */
    basePackage:string;
    /**
     * Flag indicating wheter the project has FRCMocks in build.gradle
     */
    hasMocks:boolean;
}


/**
 * Configuration file
 */
let config:ConfigData = null;
let watcher:fs.FSWatcher = null;

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
export function loadConfig(workspaceRoot:string, resPath:string):boolean{
    let configPath = workspaceRoot + "/" + vscode.workspace.getConfiguration("botbuilder").get("configPath");
    if(!fs.existsSync(configPath)){
        config = null;
        return false;
    }
    
    config = JSON.parse(fs.readFileSync(configPath).toString());
    config.workspaceRoot = workspaceRoot;
    config.resourcePath = resPath;

    // Check if frcMocks is in build and not preceeded by "//"
    config.hasMocks = /^[^\/\n]*ca.gregk:frcmocks/gm.test(fs.readFileSync(workspaceRoot+"/build.gradle").toString());

    if(watcher === null){
        //Create watcher to reload on changes
        watcher = fs.watch(configPath, { persistent:false }, ()=>{
            loadConfig(workspaceRoot, resPath);
        });
    }
    return true;
}

/**
 * Set the base package
 * @param pckg The package containg the base class
 */
export function setBasePackage(pckg:string):void {
    config.basePackage = pckg;
}

/**
 * Get a formatted version of a config package entry
 * @param raw The raw config entry
 */
export function getPackage(raw:string):string {
    return raw.replace("{BASE_PACKAGE}", config.basePackage)
            .replace(/\//g, ".");
}

export function getSubsystemPackage():string {
    return getPackage(config.subsystemPackage);
}

export function getCommandPackage():string {
    return getPackage(config.commandPackage);
}

export function getInstantCommandPackage():string {
    return getPackage(config.instantCommandPackage);
}

export function getAutoCommandPackage():string {
    return getPackage(config.autoCommandPackage);
}

export function getInstantAutoCommandPackage():string {
    return getPackage(config.instantAutoCommandPackage);
}

