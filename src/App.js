import logo from './logo.svg';
import './App.css';
import { useState, useEffect, useRef } from 'react';
import ParamList from "./components/ParamList";
import DownloadButton from "./components/DownloadButton";
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { LoadHTML, SetUpEditor, UndoEditor } from './HelperFunctions/HTMLHandler';
import { DetectParamsGlobal, RenameParam } from './HelperFunctions/ParamsHandler';
import { DownloadHTMLTemplate, DownloadCSVTemplate, HostFiles, MakeHTMLTemplate } from './HelperFunctions/FileHandler';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_PUBLIC_SUPABASE_ANON_KEY);
function App() {
  const [session, setSession] = useState(null)

  const editableRef = useRef(null);
  
  const [params, SetParams] = useState({});
  const paramsRef = useRef(params)

  const [htmlContent, SetHTML] = useState("");

  let currentHighlight = null
  const [highlight, SetHighlight] = useState(null)

  useEffect(() => {
    if(htmlContent !== "") { 
      editableRef.current = SetUpEditor(paramsRef, SetParams);
      DetectParamsGlobal(SetParams, editableRef.current)
    }
  }, [htmlContent])

  useEffect(() => {
    HighlightParam(highlight)
  }, [highlight])

  useEffect(() => {
    paramsRef.current = params
  }, [params])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  
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

  const HTMLTemplate = () => {
    UndoEditor(editableRef)
    let data = MakeHTMLTemplate(editableRef)
    SetUpEditor(paramsRef, SetParams)
    return data
  }

  if (!session) {
    return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google', 'github']} />)
  }
  else{
    return (
      <div className='App'>
        <div className="sidenav" id='sidebar'>
          <label>HTML Upload<input type="file" accept="text/html" onChange={(e)=>{LoadHTML(e, SetParams, SetHTML)}}></input></label>
          <label>CSV Upload<input type="file" accept="text/csv" id='csv'></input></label>
          <DownloadButton FileGenerator={()=>{return HostFiles(HTMLTemplate(), supabase)}} filename="data_urls.csv">Generate and Host</DownloadButton>
          <br />
          <ParamList params={params} SetParams={SetParams} HighlightParam={HighlightParam}></ParamList>
          <br />
          <div id="downloads">
            <DownloadButton FileGenerator={()=>{return HTMLTemplate().file}} filename="HTMLTemplate.html">Download HTML Template</DownloadButton>
            <DownloadButton FileGenerator={()=>{return DownloadCSVTemplate(params)}} filename="CSVTemplate.csv">Download CSV Template</DownloadButton>
          </div>
        </div>
        <div id="renderer" className='main' dangerouslySetInnerHTML={{ __html: htmlContent }}></div>  
      </div>
    );
  }
}

export default App;