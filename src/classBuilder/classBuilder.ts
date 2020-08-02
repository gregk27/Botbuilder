import { Scope } from "../javaParser/common";

export class ClassBuilder {

  imports: string[] = [];

  constructor(
    public pckg: string,
    public name: string,
    public scope: Scope,
    public superclass: ClassBuilder.Class,
    public interfaces: ClassBuilder.Class[],
    public fields: ClassBuilder.Field[],
    // public method: ClassBuilder.Method[],
    public doc: string
  ) {

  }

  addImport(imp: string): void {
    if(!this.imports.includes(imp)){
      this.imports.push(imp);
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
      out += `extends ${this.superclass.name} `;
      this.addImport(this.superclass.import);
    }
    if(this.interfaces.length !== 0){
      out += "implements ";
      for(let i of this.interfaces){
        out += i.name+", ";
        this.addImport(i.import);
      }
      out = out.slice(0, -2);
    }
    return out+" ";
  }

  getCode(): string {
    this.imports = [];

    // Package declaration + imports
    let out = `package ${this.pckg.replace(/\//g, ".")}\n\n`;
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

    out += "}";
    return out.replace("{IMPORTS}", this.getImports()).trim();
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
    name: string,
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
      out += this.type.name + " ";
      out += this.name;
      out += this.initVal !== null ? " = "+this.initVal : "";
      return out+";";
    }
  }


}