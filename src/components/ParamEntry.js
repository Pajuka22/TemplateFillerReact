function ParamEntry(props, key){
    const RenameParam = (e)=>{
        props.Rename(props.paramname, window.prompt(`Rename paramater ${props.paramname}`))
    }
    const Highlight = (e)=>{
        props.HighlightParam(props.paramname)
    }
    return (
        <div>
            <p>{props.paramname}</p>
            <button onClick={RenameParam}>Rename Parameter</button>
            <br/>
            <button onClick={Highlight}>Toggle Highlight</button>
            <br/>
        </div>
    )
}

export default ParamEntry;