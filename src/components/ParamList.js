import { useEffect } from "react";
import ParamEntry from "./ParamEntry";


function ParamList({params, Rename, HighlightParam}){
    return (
        <div>
            {Object.keys(params).map((param, key)=>{
                return (<ParamEntry paramname={param} elements={params[param]} Rename={Rename} HighlightParam={HighlightParam} key={key}></ParamEntry>)
            })}
        </div>
    )   
}

export default ParamList;