import * as fs from 'fs';
import { InnerClassesAttributeInfo, JavaClassFile, JavaClassFileReader, Modifier, SourceFileAttributeInfo } from "java-class-tools";
import { ClassDetail, ClassType, JavaBase, Scope } from "./common";
import { JavaField, JavaMethod } from "./JavaElements";
import { getClassDetail, getClassType, getScope, getStringFromPool, parseAttributes } from "./parserFunctions";

const reader = new JavaClassFileReader();

export class JavaClass extends JavaBase{

    public readonly pckg: string;
    public readonly superClass: ClassDetail;
    public readonly type: ClassType;
        
    public readonly classFile: JavaClassFile;
    public srcFile: string;
    
    public readonly fields: JavaField[];
    public readonly methods: JavaMethod[];
    public readonly innerClasses: JavaInnerClass[];

    constructor(file:JavaClassFile, basePath: string){        
        // Get name and package
        let nameDetail = getClassDetail(getStringFromPool(file, file.this_class));
        console.log(getStringFromPool(file, file.this_class));
        console.log(nameDetail);
        super(nameDetail.name, nameDetail.full, getScope(file.access_flags), (file.access_flags & Modifier.FINAL) === Modifier.FINAL);
        this.classFile = file;

        this.pckg = nameDetail.pckg;
        
        // Get class type
        this.type = getClassType(file.access_flags);

        // Get superclass and interfaces
        this.superClass = getClassDetail(getStringFromPool(file, file.super_class));
        // TODO: Add code to get interfaces

        this.fields = [];
        // Get fields
        for(let f of file.fields){
            this.fields.push(new JavaField(this, f));
        }

        this.methods = [];
        // Get methods
        for(let m of file.methods){
            this.methods.push(new JavaMethod(this, m));
        }

        console.log(JSON.stringify(this.methods));
        
        this.innerClasses = [];

        let buildPath = basePath.replace("src/main/java", "build/classes/java/main");
        this.srcFile = "";
        parseAttributes(file, file.attributes, {
            "SourceFile": (attr) => 
                this.srcFile = basePath+"/"+this.pckg+"/"+getStringFromPool(file, (<SourceFileAttributeInfo> attr).sourcefile_index),
            "InnerClasses": (attr) => {
                for(let cls of (<InnerClassesAttributeInfo> attr).classes){
                    if(file.this_class !==  cls.inner_class_info_index){ // If the inner class is also the outer class
                        let path = buildPath+getStringFromPool(file, cls.inner_class_info_index)+".class";
                        if(!fs.existsSync(path)){ // Catch files that are from external libraries
                            console.warn(`File does not exist ${path}`);
                        } else {
                            let newCls = new JavaInnerClass(reader.read(path), basePath);
                            console.log(newCls);
                            this.innerClasses.push(newCls);
                        }
                    }
                }
            }
        });
    }

    public getPrettyName(): string{
        return this.pckg.replace(/\//g, ".")+"."+this.name;
    }
    public getFullPrettyName(includeClass:boolean=false): string{
        if(this.superClass.full === "java/lang/Object"){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.full.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.full.substr(this.superClass.full.lastIndexOf("/")+1);
        }
    }
    public getDeclarationString(): string{
        let out = "";
        if(this.scope !== Scope.DEFAULT){out += this.scope;}
        if(this.isFinal){
            out += " final";
        }
        if(this.type === ClassType.INTERFACE){
            out += " interface";
        } else if(this.type === ClassType.ENUM){
            out += " enum";
        } else if(this.type === ClassType.ABSTRACT){
            out += " abstract class";
        } else {
            out += " class";
        }
        out += " "+this.name;
        // Show extensions, except for enum default
        if(this.superClass.full !== "java/lang/Object" && !(this.superClass.full === "java/lang/Enum" && this.type === ClassType.ENUM)){
            out+= " extends "+this.superClass.full.replace(/\//g, ".");
        }
        return out.trim();
    }
}

export class JavaInnerClass extends JavaClass {
    public readonly outerClass: string;

    constructor(file:JavaClassFile, basePath:string){
        super(file, basePath);
        this.outerClass = this.descriptor.substring(0,this.descriptor.lastIndexOf("$"));
    }

    public getPrettyName(): string{
        return this.outerClass.replace(/\//g, ".")+"$"+this.name;
    }
    public getFullPrettyName(includeClass:boolean): string{
        // Don't show extension if it's the default for enum
        if(this.superClass.full === "java/lang/Object" || (this.superClass.full === "java/lang/Enum" && this.type === ClassType.ENUM)){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.full.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.full.substr(this.superClass.full.lastIndexOf("/")+1);
        }
    }
}