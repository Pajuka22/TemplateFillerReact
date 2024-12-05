function DownloadButton({FileGenerator, filename, children}){
    
    function DownloadFile(blob, name) {
        console.log(blob)
        if (blob === null || blob === undefined) return;
        window.URL = window.URL || window.webkitURL;
        let uri = window.URL.createObjectURL(blob)
        let link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
            <button onClick={async e=>{const b = await FileGenerator(); DownloadFile(b, filename);}}>{children}</button>
        </>
    )
}

export default DownloadButton;