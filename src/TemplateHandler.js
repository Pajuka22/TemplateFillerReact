let elementsWithText = []
let images = []
let links = []
let params = {}
let currentHighlight = null
const paramregex = /\{\{[^(\{\})]+\}\}/g
let fill = null;

function UploadHTML(){
    var file = document.getElementById("files").files[0];
    
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            document.getElementById("renderer").innerHTML = evt.target.result;

            // Get all elements in the document
            SetUpEditor()
        }
        reader.onerror = function (evt) {
            document.getElementById("renderer").innerHTML = "error reading file";
            console.log(evt)
        }
    }
}

function LoadHTML(event){
    var file = event.target.files[0]
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            document.getElementById("renderer").innerHTML = evt.target.result;

            // Get all elements in the document
            SetUpEditor()
        }
        reader.onerror = function (evt) {
            document.getElementById("renderer").innerHTML = "error reading file";
            console.log(evt)
        }
    }
}

function SetUpEditor(){
    const allElements = document.getElementById("renderer").querySelectorAll('*');

    elementsWithText.length = 0;
    images.length = 0;
    links.length = 0;

    allElements.forEach(element => {
        // Check if the element has only text nodes (no nested HTML tags)
        const hasText = Array.from(element.childNodes).some(
            node => node.nodeType === Node.TEXT_NODE
        );
        
        if (hasText && element.textContent.trim() !== '') {
        elementsWithText.push(element);
        }
    });

    elementsWithText.forEach(lmnt => {
        lmnt.setAttribute("contenteditable", true)
        lmnt.addEventListener("input", function(event) {
            DetectParams(event.target, event.target.textContent)
        }, false);
    });

    links = document.getElementById("renderer").querySelectorAll("a")
    links.forEach(lmnt => {
        if(lmnt.textContent.trim() == ''){
            lmnt.onclick = (e)=>{
                e.preventDefault();
            }
        }
        lmnt.ondblclick = (e)=>{
            e.preventDefault();
            const newlink = window.prompt("Set This Hyperlink", e.target.closest("a").getAttribute("href"))
            if (newlink !== null){
                e.target.closest("a").href = newlink
                DetectParams(e.target.closest("a"), newlink)
            }
        }
    })

    images = document.getElementById("renderer").querySelectorAll("img")
    images.forEach(lmnt => {
        lmnt.onclick = e =>{
            if(e.ctrlKey){
                e.preventDefault();
                const newsrc = window.prompt("Set This Image Source", e.target.closest("img").getAttribute("src"));
                if (newsrc !== null && newsrc !== 'none'){
                    e.target.closest("img").src = newsrc;
                    DetectParams(e.target.closest("img"), newsrc)
                }
            }
        }
    })
    DetectParamsGlobal()
}

function MakeHTMLTemplate(){
    if(currentHighlight !== null) ToggleHighlight(currentHighlight)
    elementsWithText.forEach(lmnt => {
        lmnt.removeAttribute("contenteditable");
    })
    links.forEach(lmnt =>{
        lmnt.ondblclick = null
        lmnt.onclick = null;
    })
    images.forEach(img=>{
        img.onclick = null;
    })
    var fileName = "myfile.html";
    var fileContent = "<!DOCTYPE html><html>" + document.getElementById("renderer").innerHTML+"</html>";
    var myFile = new Blob([fileContent], {type: 'text/plain'});
    
    window.URL = window.URL || window.webkitURL;


    var dlBtn = document.getElementById("dlhtml");
    
    dlBtn.setAttribute("href", window.URL.createObjectURL(myFile));
    dlBtn.setAttribute("download", fileName);
    SetUpEditor()
}


function ParseCSV() {
    var file = document.getElementById("csv").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            let fill = Papa.parse(evt.target.result, {header: true}).data
            console.log(fill)
            MakeHTMLTemplate()
            var zip = new JSZip();
            fill.forEach(obj=>{
                if(obj.saveas === "") return;
                
                const template = Handlebars.compile("<!DOCTYPE html><html>" + document.getElementById("renderer").innerHTML + "</html>")
                const txt = template(obj)
                
                uploadFile(obj.saveas, txt)

                zip.file(obj.saveas+".html", txt)
            })
            SetUpEditor();
            zip.generateAsync({
                type: "base64"
            }).then(function(content) {
                window.location.href = "data:application/zip;base64," + content;
            });  
        }
    }
}

function MakeCSVTemplate(){
    var text = "saveas,uploadurl,"+Object.keys(params).join(",")
    var fileName = "CSVTemplate.csv"
    var myFile = new Blob([text], {type:'text/plain'})
    window.URL = window.URL || window.webkitURL;
    var dlBtn = document.getElementById("dlcsv")
    dlBtn.setAttribute("href", window.URL.createObjectURL(myFile));
    dlBtn.setAttribute("download", fileName);
    dlBtn.click()
}

function DetectParams(element, value){
    Object.keys(params).forEach(k =>{
        lst = params[k]
        index = lst.indexOf(element)
        if(index > -1) lst.splice(index)
        if(lst.length == 0){
            delete params[k]
        }
    })
    console.log(value)

    foundparams = [...value.matchAll(paramregex)]
    foundparams.forEach(prm =>{
        prm = ''+prm+''
        prm = prm.substring(2, prm.length - 2)
        if (params[prm] == null){
            params[prm] = []
        }
        params[prm].push(element)
    })
    ReloadParamsDisplay()
}

function DetectParamsGlobal(){

    params = {}
    let lists = [{"list": elementsWithText, "attr":"textContent"}, {"list":links, "attr":"href"}, {"list":images, "attr":"src"}]
    lists.forEach(listattr =>{
        listattr.list.forEach(lmnt =>{
            console.log(listattr.attr)
            content = lmnt.getAttribute(listattr.attr)
            if (content === null){
                content = lmnt[listattr.attr]                            
            }
            foundparams = [...content.matchAll(paramregex)]
            foundparams.forEach(prm =>{
                prm = ''+prm+''
                prm = prm.substring(2, prm.length - 2)
                if (params[prm] == null){
                    params[prm] = []
                }
                params[prm].push(lmnt)
            })
        })
    })
    ReloadParamsDisplay()
}

function RenameParam(oldname, newname){
    if(currentHighlight === oldname){
        currentHighlight = newname
    }
    if(params[oldname] == null) return;
    if(newname == null || newname.trim() == "") return;
    
    params[oldname].forEach(element =>{
        children = element.childNodes;
        const attributes = element.attributes
        console.log(attributes)
        for(let i = 0; i < attributes.length; ++i){
            const attr = attributes[i];
            console.log(attr)
            element.setAttribute(attr.name, element.getAttribute(attr.name).replaceAll(`{{${oldname}}}`, `{{${newname}}}`))
        }
        // element.textContent = element.textContent.replaceAll()
        // console.log(children)
        element.textContent = element.textContent.replaceAll(`{{${oldname}}}`, `{{${newname}}}`)
        // element.childNodes = inner
    })
    if (params[newname] == null) {    
        params[newname] = params[oldname]
    }
    else{
        params[newname].concat(params[oldname]);
    }
    delete params[oldname]
    ReloadParamsDisplay();
}

function ReloadParamsDisplay(){
    console.log(params)
    document.getElementById("paramslist").innerHTML = Object.keys(params).map(p =>{
        return `
        <div>
            <div>${p}<br></div>
            <button onclick="RenameParam('${p}', window.prompt('Rename Parameter', '${p}'))">Rename</button>
            <button onclick="ToggleHighlight('${p}')">Toggle Highlight</button> 
            <br>
        </div>`
    }).join("");
}

function ParameterizeLinks(){
    let links = document.getElementById("renderer").getElementsByTagName('a')
    let links_grouped = {}
    links.forEach(lmnt=>{
        if(!links_grouped.hasOwnProperty(lmnt.href)){
            links_grouped[lmnt.href] = [];
        }
        links_grouped.push(lmnt);
    })
    let form = document.getElementById("linksform");
    inputs = Object.keys(links).map(url=>{
        return `<label>${links[url].length} instances<input type=text placeholder=${url}></label>`
    });

}

function FindElementsWithParam(param){
    const elementswithparam = []
    elementsWithText.forEach(element => {
        if(element.textContent.includes(`{{${param}}}`)){
            elementswithparam.push(element)
        }
    });
    links.forEach(link=>{
        if(link.href == `{{${param}}}`){
            elementswithparam.push(link)
        }
    })
    images.forEach(img=>{
        if(img.src == `{{${param}}}`){
            elementswithparam.push(img)
        }
    })
} 

function ToggleHighlight(p){
    console.log(params)
    if(currentHighlight !== null){
        params[currentHighlight].forEach(lmnt=>{
            lmnt.style.outline = null;
        })
    }
    if(currentHighlight !== p){
        params[p].forEach(lmnt=>{
            lmnt.style.outline = "solid red";
        })
        currentHighlight = p;
    }
    else currentHighlight = null;
}


export {LoadHTML, ParseCSV, MakeHTMLTemplate};