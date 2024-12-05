import Papa from 'papaparse'
import JSZip from 'jszip';
import Handlebars from 'handlebars';

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function(e) {
      // Resolve the Promise with the content of the file
      resolve(e.target.result);
    };

    reader.onerror = function(e) {
      reject(new Error('Error reading file: ' + e.target.error));
    };

    // Read the file as text (you can adjust the method depending on the file type)
    reader.readAsText(file);
  });
}

const MakeHTMLTemplate = () => {
    var fileContent = "<!DOCTYPE html><html>" + document.getElementById("renderer").innerHTML + "</html>";
    var myFile = new Blob([fileContent], { type: 'text/plain' });
    return {"file": myFile, "filedata":fileContent};
}

const HostFiles = async (htmlTemplate,client) => {
    var file = document.getElementById("csv").files[0];
    if (file) {
      var fill = {};
      var please = await readFile(file);
      fill = structuredClone(Papa.parse(please, { header: true }).data)
      var templateContent = htmlTemplate.filedata
      var zip = new JSZip();
      for(let i = 0; i < fill.length; ++i){
        let obj = fill[i]
        if (obj.saveas === "") continue;
        const template = Handlebars.compile(templateContent)
        const txt = template(obj)
        //upload file
        const { data, error } = client.storage
          .from(process.env.REACT_APP_BUCKET_NAME)
          //this is done so that if at a later point i want to upload images as well it can be done.
          .upload(`${obj.saveas}/index.html`, txt, {"upsert":true});

        if (error) {
          console.error('Error uploading file:', error);
          return null;
        } else {
          console.log('File uploaded successfully:', data);
          obj.url = `https://host-from-supabase.vercel.app/${obj.saveas}`;
        }
      }
      const fileContent = Papa.unparse(fill)
      const blob = new Blob([fileContent], { type: 'text/plain' });
      return blob;
    }
    return null;
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
        zip.generateAsync({
          type: "base64"
        }).then(function (content) {
          window.location.href = "data:application/zip;base64," + content;
        });
      }
    }
}

const DownloadCSVTemplate = (params) => {
  var text = "saveas," + Object.keys(params).join(",")
  var myFile = new Blob([text], { type: 'text/plain' })
  return myFile;
}

export { DownloadCSVTemplate, HostFiles, DownloadFiles, MakeHTMLTemplate };
