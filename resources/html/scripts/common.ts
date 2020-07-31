export namespace webview {
    /** Template for messages with frontened */
    export interface Message {
        id:string;
        payload:any
    }

    /**
     * General interface used to exporting/importing data
     */
    export interface InputState {
        /** Id of the respective HTML element (will vary by type) */
        id:string;
        /** The type of data included */
        dataType:InputType;
        /** The data payload */
        data:any;
    }

    /**
     * Enum used to differentiate between data types
     */
    export enum InputType {
        /** Data is from an input line */
        INPUT_LINE = "InputLine",
        /** Data is from an argument selector */
        ARGUMENT_SELECTOR = "ArgumentSelector"
    }

    /**
     * Interface for inputs which have persistent state
     */
    export interface Persistent {
        /**
         * Set state from DataVal;
         */
        fromState(data:webview.InputState):void;
        /**
         * Called to export state to DataVal
         */
        getState():webview.InputState;
    }
}