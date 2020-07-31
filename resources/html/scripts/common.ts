/**
 * General interface used to exporting/importing data
 */
export interface DataVal {
    /** Id of the respective HTML element (will vary by type) */
    id:string;
    /** The type of data included */
    dataType:DataType;
    /** The data payload */
    data:any;
}

/**
 * Enum used to differentiate between data types
 */
export enum DataType {
    /** Data is from an input line */
    INPUT_LINE = "InputLine",
    /** Data is from an argument selector */
    ARGUMENT_SELECTOR = "ArgumentSelector"
}