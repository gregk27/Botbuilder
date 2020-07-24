import * as fs from 'fs';
import { InnerClassesAttributeInfo, JavaClassFile, JavaClassFileReader, Modifier, SourceFileAttributeInfo } from "java-class-tools";
import { ClassDetail, ClassType, JavaBase, Scope } from "./common";
import { JavaField, JavaMethod } from "./JavaElements";
import { getClassDetail, getClassType, getScope, getStringFromPool, parseAttributes } from "./parserFunctions";

/** Reader used to read subclasses */
const reader = new JavaClassFileReader();

/**
 * Class representing a Java Class
 */
export class JavaClass extends JavaBase{

    /**
     * The package containing the class, slash-separated
     */
    public readonly pckg: string;
    /**
     * The {@link ClassDetail} with information regarding the superclass
     */
    public readonly superClass: ClassDetail;
    /**
     * The {@link ClassType} of the class.
     * @remarks final enums are marked as Enum
     */
    public readonly type: ClassType;
    
    /**
     * The {@link JavaclassFile} containing the raw information about the class
     */
    public readonly classFile: JavaClassFile;
    /**
     * The `.java` source file, extracted from the `.class` file
     */
    public srcFile: string;
    
    /**
     * Array containing the {@link JavaField | Fields} of the class
     */
    public readonly fields: JavaField[];
    /**
     * Array containing the {@link JavaMethod | Methods} of the class
     */
    public readonly methods: JavaMethod[];
    /**
     * Array conaining the {@link JavaInnerClass | InnerClasses} of the class (includes enums)
     */
    public readonly innerClasses: JavaInnerClass[];

    /**
     * Parse a Java Class from a specified JavaClassFile
     * @param file The JavaClassFile to parse from
     * @param basePath The path to the base of the package
     */
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
    
    /**
     * Get an extended version of the pretty-print name 
     * @param includeClass Flag to indicate wether the superclass package should be included
     * @remarks Classes extending `java.lang.Object` and enums extending `java.lang.Enum` will not include these superclasses
     */
    public getFullPrettyName(includeClass:boolean=false): string{
        if(this.superClass.full === "java/lang/Object" || (this.superClass.full === "java/lang/Enum" && this.type === ClassType.ENUM)){
            return this.getPrettyName();
        }
        if(includeClass){
            return this.getPrettyName() + " extends " + this.superClass.full.replace(/\//g, "."); 
        } else {
            return this.getPrettyName() + " extends " + this.superClass.name;
        }
    }

    /**
     * Get a string representation of the class declaration
     */
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

/**
 * A class used to represent Inner Classes
 * @see JavaClass
 */
export class JavaInnerClass extends JavaClass {
    /**
     * The {@link JavaBase#descriptor | descriptor} of the class containing this inner class
     */
    public readonly outerClass: string;

    /**
     * Parse a Java Class from a specified JavaClassFile
     * @param file The JavaClassFile to parse from
     * @param basePath The path to the base of the package
     */
    constructor(file:JavaClassFile, basePath:string){
        super(file, basePath);
        this.outerClass = this.descriptor.substring(0,this.descriptor.lastIndexOf("$"));
    }

    public getPrettyName(): string{
        return this.outerClass.replace(/\//g, ".")+"$"+this.name;
    }
}