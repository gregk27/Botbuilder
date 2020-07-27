import { JavaClassFileReader } from "java-class-tools";
import { JavaClass } from "./JavaClasses";
import { getStringFromPool } from "./parserFunctions";
import * as fs from "fs";

const reader = new JavaClassFileReader();

/**
 * Parse a Java Class from a specified `.class` file
 * @param filePath Path to the `.class` file
 * @param srcPath The path to the base of the src package
 * @param temp Tempoarary variable to find implementations of function
 */
export function parseFile(filePath:string, srcPath:string, temp:boolean) : JavaClass{
    if(!filePath.endsWith(".class")){
        throw new Error("Not a class file");
    }
    let file = reader.read(filePath);
    let name = getStringFromPool(file, file.this_class);
    let buildPath = filePath.replace(name+".class", "");
    return new JavaClass(file, srcPath, buildPath);
}

export async function parseFolder(folder:string, srcPath:string, recursive:boolean=true, onItem:(cls:JavaClass)=>void=null): Promise<JavaClass[]> {
    let files = fs.readdirSync(folder);
    if(files === undefined){
        console.log("No files found");
        return null;
    }
    let classes:JavaClass[] = [];
    let promises:Promise<JavaClass[]>[] = [];
    for(let fileName of files){
        let filePath = folder+"/"+fileName;
        if(fs.lstatSync(filePath).isDirectory() && recursive){
            promises.push(parseFolder(filePath, srcPath, true, onItem));
        } else if (filePath.endsWith(".class")) {
            let cls = parseFile(filePath, srcPath, false);
            if(onItem !== null){
                onItem(cls);
            }
            classes.push(cls);
       }
    }
    for(let res of await Promise.all(promises)){
        classes.push(... res);
    }
    return classes;
}