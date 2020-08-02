import { Scope } from "../javaParser/common";
import * as fs from "fs";

export class ClassBuilder {

  imports: string[] = [];

  constructor(
    public pckg: string,
    public name: string,
    public scope: Scope,
    public superclass: ClassBuilder.Class,
    public interfaces: ClassBuilder.Class[],
    public fields: ClassBuilder.Field[],
    public methods: ClassBuilder.Method[],
    public doc: string=null,
    public body:string=null
  ) {

  }

  addImport(imp: string): void {
    if(imp !== null){
      if(!this.imports.includes(imp)){
        this.imports.push(imp);
      }
    }
  }

  getImports(): string {
    let out = "";
    for(let i of this.imports){
      out += `import ${i.replace(/\//g, ".")};\n`;
    }
    return out;
  }

  getSupers(): string {
    let out = "";
    if(this.superclass !== null){
      out += `extends ${this.superclass.type} `;
      this.addImport(this.superclass.import);
    }
    if(this.interfaces.length !== 0){
      out += "implements ";
      for(let i of this.interfaces){
        out += i.type+", ";
        this.addImport(i.import);
      }
      out = out.slice(0, -2);
    }
    return out+" ";
  }

  getCode(): string {
    this.imports = [];

    // Package declaration + imports
    let out = `package ${this.pckg.replace(/\//g, ".")};\n\n`;
    out += `{IMPORTS}\n`;
    // Class declaration
    out += getDocString(this.doc)+"\n";
    out += `${this.scope} class ${this.name} ${this.getSupers()}{\n\n`;
    // Fields
    if(this.fields !== null){
      for(let f of this.fields){
        out += "\t"+f.getCode().replace(/\n/g, "\n\t")+"\n";
        this.addImport(f.type.import);
      }
    }
    out += "\n\n";
    // Methods
    if(this.methods !== null){
      for(let m of this.methods){
        out += "\t"+m.getCode(this.name).replace(/\n/g, "\n\t")+"\n\n";
        if(m.returnType !== null){
          this.addImport(m.returnType.import);
        }
      }
    }

    out += "}";
    return out.replace("{IMPORTS}", this.getImports()).trim();
  }

  writeFile(basePath:string){
    let path = basePath+"/"+this.pckg.replace(/\./g, "/")+"/"+this.name+".java";
    fs.writeFileSync(path, this.getCode());
  }


}

function getDocString(doc: string): string {
  let out = "/**\n";
  for(let l of doc.split("\n")){
    out += " * " + l +"\n";
  }
  out += " */";
  return out;
}

export namespace ClassBuilder {

  /**
   * Interface used to pass information about classes
   */
  export interface Class {
    /**
     * The name of the class, will be used in delcarations
     */
    type: string,
    /**
     * The import needed for this class
     * @remark This value should be `null` if no import is needed (E.g. primitives)
     */
    import: string,
  }

  export interface Type extends Class {
    /**
     * Indicates if this is an array
     */
    isArray: boolean

  }

  export interface MethodParam extends Type {
    /**
     * The type of the parameter
     */
    name:string;
    /**
     * The doc for `@param`
     */
    doc:string;
  }

  /**
   * Interface used to pass information about fields
   */
  export class Field {
    constructor(
      /**
       * The type of the field
       */
      public type: Type,
      /**
       * The name of the field
       */
      public name: string,
      /**
       * Scope of the field
       */
      public scope: Scope=Scope.DEFAULT,      
      /**
      * The javadoc for the field
      * @remark If `null`, no documentation will be created
      */
      public doc: string=null,
      /**
       * Boolean indicating if the field is final
       */
      public isFinal: boolean=false,
      /**
       * Boolean indicating if the field is static
       */
      public isStatic: boolean=false,
      /**
       * The intial value to set
       */
      public initVal: string=null
    ) {

    }

    getCode(){
      let out = "";
      if(this.doc !== null){
        out += getDocString(this.doc)+"\n";
      }
      out += this.scope === Scope.DEFAULT ? "" : this.scope+" ";
      out += this.isStatic ? "static " : "";
      out += this.isFinal ? "final ": "";
      out += this.type.type + " ";
      out += this.name;
      out += this.initVal !== null ? " = "+this.initVal : "";
      return out+";";
    }
  }

  
  /**
   * Interface used to pass information about methods
   */
  export class Method {
    constructor(
      /**
       * The return type of the method
       * @remark To return void, make this value `null`
       */
      public returnType: Type,
      /**
       * The name of the method
       * @remark If the value is `CONSTRUCTOR`, the method will be a constructor
       */
      public name: string,
      /**
       * The method parameters
       */
      public params: MethodParam[],
      /**
       * Scope of the method
       */
      public scope: Scope = Scope.DEFAULT,
      /**
       * The method documentation (note: `@param` values will be taken from args' doc)
       */
      public doc: string = null,
      /**
       * Boolean indicating if the method is final
       */
      public isFinal: boolean = false,
      /**
       * Boolean indicating if the method is static
       */
      public isStatic: boolean = false,
      /**
       * The method body, as a string
       */
      public body: string = null
    ) {
    }

    
    getCode(className:string){
      let out = "";
      let doc = "";
      if(this.doc !== null){
        doc = getDocString(this.doc);
        doc = doc.slice(0,doc.lastIndexOf(" */"));
      }
      out += this.scope === Scope.DEFAULT ? "" : this.scope+" ";
      out += this.isStatic ? "static " : "";
      out += this.isFinal ? "final ": "";
      if(this.name === null || this.name === className){
        out += className;
      } else {
        out += (this.returnType?.type || "void") + " ";
        out += this.name;
      }
      out += "(";
      if(this.params !== null && this.params.length > 0){
        for(let p of this.params){
          out += p.type + " " + p.name+", ";
          if(p.doc !== null){
            if(p.doc.includes("\n")){
              p.doc = p.doc.substring(0, p.doc.lastIndexOf("\n"));
            }
            doc += ` * @param ${p.name} ${p.doc}\n`;
          }
        }
        out = out.slice(0, -2);
      }
      out += ") {\n";
      if(this.body === null){
        out +=  "\t//TODO: Auto generated method stub";
      } else {
        out += "\t"+this.body.replace(/\n/g, "\n\t");
      }
      return doc+" */\n"+out+"\n}";
    }
  }

}