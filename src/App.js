import logo from './logo.svg';
import './App.css';
import { useState, useEffect, useRef } from 'react';
import ParamList from "./components/ParamList";
import Papa from 'papaparse'
import JSZip from 'jszip';
import Handlebars from 'handlebars';
import { createClient } from '@supabase/supabase-js';

function App() {
  let links = [];
  let images = [];
  let textElements = [];
  let  editableElements = {"text":textElements, "img":images, "link":links};
  const editableRef = useRef(editableElements);
  const [params, SetParams] = useState({});
  const paramsRef = useRef(params)
  const [htmlContent, SetHTML] = useState("");
  const paramregex = /{{[^({})]+}}/g
  let currentHighlight = null

  useEffect(() => {
    SetUpEditor();
  }, [htmlContent])

  useEffect(() => {
    paramsRef.current = params
  }, [params])


  const UpdateParams = () => {
    let newparams = {};
    Object.keys(params).forEach(key => {
      newparams[key] = [...params[key]];
    })
    SetParams(newparams)
  }

  const LoadHTML = (event) => {
    SetParams({})
    SetHTML("")
    var file = event.target.files[0]
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        SetHTML(evt.target.result);
      }
      reader.onerror = function (evt) {
        document.getElementById("renderer").innerHTML = "error reading file";
        console.log(evt);
      }
    }
  }

  const SetUpEditor = () => {
    function hasVisibleText(element) {
      // Check if the element has child nodes that are text
      const childNodes = Array.from(element.childNodes);
      for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          // Check if the text content is non-empty and not just whitespace
          if (node.textContent.trim() !== '') {
            // Check if the element is visible
            const style = window.getComputedStyle(element);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              return true;
            }
          }
        }
      }
      return false;
    }
    
    const allElements = document.getElementById("renderer").querySelectorAll('*');
    // console.log(document.getElementById("renderer").innerHTML)
    // console.log(allElements)
    textElements.length = 0;
    // images.length = 0;
    // links.length = 0;

    allElements.forEach(element => {
      // Check if the element has only text nodes (no nested HTML tags)
      const hasText = Array.from(element.childNodes).every(
        node => {
          if(node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''){
            console.log(node.textContent)
            return true;
          }
          return false;
        }
      );

      if (hasText && element.textContent.trim() !== '') {
        element.contentEditable = true;
        textElements.push(element);
        element.addEventListener("input", (event) => {
          DetectParams(event.target, event.target.textContent)
        }, false);
      }
    });


    links = document.getElementById("renderer").querySelectorAll("a")
    links.forEach(lmnt => {
      if (lmnt.textContent.trim() === '') {
        lmnt.addEventListener("click", (event) => {
          event.preventDefault();
        });
      }
      lmnt.addEventListener("dblclick", (e) => {
        e.preventDefault();
        const newlink = window.prompt("Set This Hyperlink", e.target.closest("a").getAttribute("href"))
        if (newlink !== null) {
          e.target.closest("a").setAttribute("href", newlink)
          DetectParams(e.target.closest("a"), newlink)
        }
      })
    })

    images = document.getElementById("renderer").querySelectorAll("img");
    images.forEach(lmnt => {
      lmnt.addEventListener("click", e => {
        if (e.ctrlKey) {
          e.preventDefault();
          const newsrc = window.prompt("Set This Image Source", e.target.closest("img").getAttribute("src"));
          if (newsrc !== null && newsrc !== 'none') {
            e.target.closest("img").src = newsrc;
            DetectParams(e.target.closest("img"), newsrc)
          }
        }
      })
    })
    editableElements.text=textElements;
    editableElements.img=images;
    editableElements.link=links;
    editableRef.current=editableElements;
    DetectParamsGlobal();
  }

  function DetectParams(element, value) {
    let newparams = {};

    Object.keys(paramsRef.current).forEach(param => {
      newparams[param] = paramsRef.current[param]
      const list = newparams[param]
      const index = list.indexOf(element);
      if (index > -1) list.splice(index, 1)
      if (list.length == 0) delete newparams[param]
    })
    let foundparams = [...value.matchAll(paramregex)]
    foundparams.forEach(prm => {
      prm = '' + prm + ''
      prm = prm.substring(2, prm.length - 2)
      if (newparams[prm] == null) {
        newparams[prm] = []
      }
      newparams[prm].push(element)
    })
    SetParams(newparams)
  }

  function DetectParamsGlobal() {

    let newparams = {}
    let lists = [{ "list": textElements, "attr": "textContent" }, { "list": links, "attr": "href" }, { "list": images, "attr": "src" }]
    lists.forEach(listattr => {
      listattr.list.forEach(lmnt => {
        let content = lmnt.getAttribute(listattr.attr)
        if (content === null) {
          content = lmnt[listattr.attr]
        }
        const foundparams = [...content.matchAll(paramregex)]
        foundparams.forEach(prm => {
          prm = '' + prm + ''
          prm = prm.substring(2, prm.length - 2)
          if (newparams[prm] == null) {
            newparams[prm] = []
          }
          newparams[prm].push(lmnt)
        })
      })
    })
    SetParams(newparams)
  }

  function RenameParam(oldname, newname) {
    if (params[oldname] == null) return;
    if (newname == null || newname.trim() == "") return;

    params[oldname].forEach(element => {
      const attributes = element.attributes
      for (let i = 0; i < attributes.length; ++i) {
        const attr = attributes[i];
        element.setAttribute(attr.name, element.getAttribute(attr.name).replaceAll(`{{${oldname}}}`, `{{${newname}}}`))
      }
      element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.data = node.data.replaceAll(`{{${oldname}}}`, `{{${newname}}}`)
        }
      })
    })
    if (params[newname] == null) {
      params[newname] = params[oldname]
    }
    else {
      params[newname].concat(params[oldname]);
    }
    delete params[oldname]
    UpdateParams()
  }


  const HighlightParam = (p) => {
    if (currentHighlight !== null) {
      params[currentHighlight].forEach(lmnt => {
        lmnt.style.outline = null;
      })
    }
    if (currentHighlight !== p) {
      params[p].forEach(lmnt => {
        lmnt.style.outline = "solid red";
      })
      currentHighlight = p;
    }
    else currentHighlight = null;
  }

  const DownloadFiles = () => {
    var file = document.getElementById("csv").files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        let fill = Papa.parse(evt.target.result, { header: true }).data
        var fileContent = MakeHTMLTemplate().filedata
        var zip = new JSZip();
        fill.forEach(obj => {
          if (obj.saveas === "") return;
          const template = Handlebars.compile(fileContent)
          const txt = template(obj)
          zip.file(obj.saveas + ".html", txt)
        })
        SetUpEditor();
        zip.generateAsync({
          type: "base64"
        }).then(function (content) {
          window.location.href = "data:application/zip;base64," + content;
        });
      }
    }
  }

  const HostFiles = async (e) => {
    //create client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    var file = document.getElementById("csv").files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        let fill = Papa.parse(evt.target.result, { header: true }).data
        var templateContent = MakeHTMLTemplate().filedata
        var zip = new JSZip();
        fill.forEach(async obj => {
          if (obj.saveas === "") return;
          const template = Handlebars.compile(templateContent)
          const txt = template(obj)
          //upload file
          const { data, error } = await supabase.storage
            .from(process.env.REACT_APP_BUCKET_NAME)
            //this is done so that if at a later point i want to upload images as well it can be done.
            .upload(`${obj.saveas}/index.html`, txt, {"upsert":true});

          if (error) {
            console.error('Error uploading file:', error);
          } else {
            console.log('File uploaded successfully:', data);
          }
          
        })
        window.alert("done!")
        SetUpEditor();
      }
    }
  }

  const DownloadCSVTemplate = (e) => {
    var text = "saveas," + Object.keys(params).join(",")
    var fileName = "CSVTemplate.csv"
    var myFile = new Blob([text], { type: 'text/plain' })
    window.URL = window.URL || window.webkitURL;
    var dlBtn = document.getElementById("dlcsv")
    dlBtn.setAttribute("href", window.URL.createObjectURL(myFile));
    dlBtn.setAttribute("download", fileName);
    dlBtn.click()
  }

  function MakeHTMLTemplate() {
    let textElements=editableRef.current.text;
    let links = editableRef.current.link;
    let images = editableRef.current.img;

    if (currentHighlight !== null) HighlightParam(currentHighlight)
    const editable = document.getElementById("renderer").querySelectorAll('[contentEditable]')
    textElements.forEach(lmnt => {
      lmnt.removeAttribute("contenteditable");
      console.log(lmnt.contentEditable)
    })
    links.forEach(lmnt => {
      lmnt.ondblclick = null
      lmnt.onclick = null;
    })
    images.forEach(img => {
      img.onclick = null;
    })
    var fileName = "myfile.html";
    var fileContent = "<!DOCTYPE html><html>" + document.getElementById("renderer").innerHTML + "</html>";
    var myFile = new Blob([fileContent], { type: 'text/plain' });

    window.URL = window.URL || window.webkitURL;
    SetUpEditor()
    console.log(fileContent)
    return {"file": myFile, "filedata":fileContent};

  }

  const DownloadHTMLTemplate = (e) => {
    var myFile = MakeHTMLTemplate().file;
    var dlBtn = document.getElementById("dlhtml");

    dlBtn.setAttribute("href", window.URL.createObjectURL(myFile));
    dlBtn.setAttribute("download", "HTMLTemplate.html");
    dlBtn.click();

  }

  return (
    <div className='App'>
      <div className="sidenav" id='sidebar'>
        <label>HTML Upload<input type="file" onChange={LoadHTML}></input></label>
        <label>CSV Upload<input type="file" id='csv'></input></label>
        <button onClick={HostFiles}>Generate and Host</button>
        <ParamList params={params} Rename={RenameParam} HighlightParam={HighlightParam}></ParamList>
        <br />
        <div id="downloads">
          <button id="generate" onClick={DownloadHTMLTemplate}>Download HTML Template</button>
          <a id="dlhtml" style={{ "display": "none" }}></a>
          <button id="csvgen" onClick={DownloadCSVTemplate}>Download CSV Template</button>
          <a id="dlcsv" style={{ "display": "none" }}></a>
        </div>
      </div>
      <div id="renderer" className='main' dangerouslySetInnerHTML={{ __html: htmlContent }}></div>

    </div>
  );
}

export default App;
