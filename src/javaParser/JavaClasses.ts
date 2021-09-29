import * as fs from 'fs';
import { InnerClassesAttributeInfo, JavaClassFile, JavaClassFileReader, Modifier, SourceFileAttributeInfo, ConstantType } from "java-class-tools";
import { ClassDetail, ClassType, JavaBase, Scope } from "./common";
import { JavaField, JavaMethod } from "./JavaElements";
import { getClassDetail, getClassType, getScope, getStringFromPool, parseAttributes, getJavadoc } from "./parserFunctions";

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
    public readonly interfaces: ClassDetail[];
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
     * Path to the `.java` source file, extracted from the `.class` file
     */
    public srcFile: string;
    /**
     * Text content of source file
     */
    public srcText:string;
    
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
     * @param file The JavaClassFile to parse from or the string pointing to said file
     * @param srcPath The path to the base of the src package
     * @param buildPath The path to the base of the build package
     */
    constructor(file:JavaClassFile, srcPath: string, buildPath: string){        
        // Set the type for future use
        // Get name and package
        let nameDetail = getClassDetail(getStringFromPool(file, file.this_class));
        console.log("Parsing "+nameDetail.full);
        super(nameDetail.name, nameDetail.full, getScope(file.access_flags), (file.access_flags & Modifier.FINAL) === Modifier.FINAL);
        this.classFile = file;

        this.pckg = nameDetail.pckg;
        
        // Get class type
        this.type = getClassType(file.access_flags);

        // Get superclass and interfaces
        this.superClass = getClassDetail(getStringFromPool(file, file.super_class));
        
        this.innerClasses = [];

        this.srcFile = "";
        parseAttributes(file, file.attributes, {
            "SourceFile": (attr) => {
                this.srcFile = srcPath+"/"+this.pckg+"/"+getStringFromPool(file, (<SourceFileAttributeInfo> attr).sourcefile_index);
                this.srcText = fs.readFileSync(this.srcFile).toString();
                this.javadoc = getJavadoc(this, this.getDeclaration());
            },
            "InnerClasses": (attr) => {
                for(let cls of (<InnerClassesAttributeInfo> attr).classes){
                    if(file.this_class !==  cls.inner_class_info_index){ // If the inner class is also the outer class
                        let path = buildPath+getStringFromPool(file, cls.inner_class_info_index)+".class";
                        if(!fs.existsSync(path)){ // Catch files that are from external libraries
                            console.warn(`File does not exist ${path}`);
                        } else {
                            let newCls = new JavaInnerClass(reader.read(path), srcPath, buildPath);
                            this.innerClasses.push(newCls);
                        }
                    }
                }
            }
        });

        console.log(this.srcText);

        // TODO: Add code to get interfaces
        this.interfaces = [];
        //Get interfaces
        for(let i of file.interfaces){
            this.interfaces.push(getClassDetail(getStringFromPool(file, i)));
        }

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

        console.log();
    }

    /**
     * Get the pretty-print `extends [superclass name]`, unless superclass is Object or Enum
     * @param pckg If true, will include 
     */
    protected getSuperPretty(pckg:boolean){
        let out = "";
        if(this.superClass.full !== "java/lang/Object" && (this.type !== ClassType.ENUM && this.superClass.full !== "java/lang/Enum")){
            out += " extends ";
            if(pckg){
                out+=this.superClass.pckg+"/";
            }
            if(this.superClass.outer !== null){
                out += this.superClass.outer + "$" + this.superClass.name;
            } else {
                out += this.superClass.name;
            } 
        }      
        return out;
    }

    /**
     * Get the name of the class
     * @param extended If true, will include `extends [superclass name]`, unless superclass is Object or Enum
     */
    public getName(extended: boolean): string {
        if(extended){
            return this.name + this.getSuperPretty(false);
        } else {
            return this.name;
        }
    }

    /**
     * Equivalent to {@link JavaClass#getName()}
     * @see JavaClass#getName()
     */
    public getPrettyName(extended: boolean): string {
        return this.getName(extended);
    }

    /**
     * Get the class name with full superclass package+name
     * @param extended If true, class package will be included
     */
    public getFullName(extended: boolean): string {
        if(extended){
            return this.pckg+"/"+this.name+this.getSuperPretty(true);
        } else {
            return this.name+this.getSuperPretty(true);
        }
    }
    
    public getSignature(): string {
        return this.descriptor;
    }
    public getDeclaration(): string {
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
        out += " "+this.name+this.getSuperPretty(false);
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
     * @param srcPath The path to the base of the package
     * @param buildPath The path to the base of the build package
     */
    constructor(file:JavaClassFile, srcPath:string, buildPath:string){
        super(file, srcPath, buildPath);
        this.outerClass = this.descriptor.substring(0,this.descriptor.lastIndexOf("$"));
    }

    /**
     * Get the name of the class, including the outer class, in the format `OuterClass.InnerClass`
     * @param extended If true, will include `extends [superclass name]`, unless superclass is Object or Enum
     * 
     * @see JavaInnerClass#getPretty()
     */
    public getName(extended: boolean): string {
        if(extended){
            return this.outerClass.substring(this.outerClass.lastIndexOf("/")+1)+"."+this.name + this.getSuperPretty(false);
        } else {
            return this.outerClass.substring(this.outerClass.lastIndexOf("/")+1)+"."+this.name;
        }
    }

    /**
     * Get the name of the class, without including the outer class
     * @param extended If true, will include `extends [superclass name]`, unless superclass is Object or Enum
     * 
     * @see JavaInnerClass#getName()
     */
    public getPrettyName(extended: boolean): string {
        if(extended){
            return this.name + this.getSuperPretty(false);
        } else {
            return this.name;
        }
    }

    /**
     * Get the class name with full package+name
     * @param extended If true, superclass will be included
     * 
     * @see JavaInnerClass#getName()
     */
    public getFullName(extended: boolean): string {
        if(extended){
            return this.outerClass+"."+this.name+this.getSuperPretty(true);
        } else {
            return this.outerClass+"."+this.name;
        }
    }
}