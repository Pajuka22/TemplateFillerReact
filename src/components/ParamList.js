import { useEffect } from "react";
import ParamEntry from "./ParamEntry";
import { RenameParam } from "../HelperFunctions/ParamsHandler";


function ParamList({params, SetParams, HighlightParam}){
    const Rename = (oldname, newname) => {
        RenameParam(params, oldname, newname, SetParams)
    }
    return (
        <div>
            {Object.keys(params).map((param, key)=>{
                return (<ParamEntry paramname={param} elements={params[param]} Rename={Rename} HighlightParam={HighlightParam} key={key}></ParamEntry>)
            })}
        </div>
    )   
}

export default ParamList;