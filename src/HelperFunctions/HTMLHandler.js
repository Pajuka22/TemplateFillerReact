import { DetectParams} from "./ParamsHandler";
const linkdblclick = (event) => {
	event.preventDefault();
	const newlink = window.prompt("Set This Hyperlink", event.target.closest("a").getAttribute("href"))
	if (newlink !== null) {
		event.target.closest("a").setAttribute("href", newlink)
	}
}

const imgclick = (event) => {
	event.preventDefault();
	if(event.ctrlKey){
		const newsrc = window.prompt("Set This Image Source", event.target.closest("img").getAttribute("src"))
		if (newsrc !== null && newsrc !== 'none') {
			event.target.closest("img").src = newsrc;
		}
	}
}

function textInputEvent(paramsRef, SetParams){
	const ev = (event=>{
		event.preventDefault();
		DetectParams(event.target, event.target.textContent, paramsRef, SetParams)
	})
	return ev;
}

const LoadHTML = (event, SetParams, SetHTML) => {
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

const SetUpEditor = (paramsRef, SetParams) => {
	const allElements = document.getElementById("renderer").querySelectorAll('*');
	let textElements = [];
	//find all text elements. we're doing this so we can handle events and track parameters
	allElements.forEach(element => {
		// Check if the element has only text nodes (no nested HTML tags)
		const hasText = Array.from(element.childNodes).some(
			node => {
				if(node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''){
					return true;
				}
				return false;
			}
		);
		if (hasText && element.textContent.trim() !== '') {
			element.contentEditable = true;
			textElements.push(element);
		}
	});

	let links = document.getElementById("renderer").querySelectorAll("a")
	let images = document.getElementById("renderer").querySelectorAll("img");

	let editableElements= [
		{list: textElements, events: [{trigger: "input", action:textInputEvent(paramsRef, SetParams)}], attrs: ["textContent"], editorAttributes: ["contenteditable"]},
		{list: images, events: [{trigger: "click", action: imgclick}], attrs: ["src"]},
		{list: links, events: [{trigger: "dblclick", action: linkdblclick}, {trigger: "click", action: (e)=>{e.preventDefault()}}], attrs: ["href"]}
	];

	editableElements.forEach(element => {
        element.list.forEach(lmnt => {
			if(element.editorAttributes !== undefined){
				element.editorAttributes.forEach(attr => {
					lmnt.setAttribute(attr, "")
				})
			}
          	element.events.forEach(event => {
				lmnt.addEventListener(event.trigger, event.action)
			})
		})
	})
    return editableElements;
}

const UndoEditor = (editableRef) => {
    editableRef.current.forEach(element => {
		element.list.forEach(lmnt => {
			if(element.editorAttributes !== undefined){
				element.editorAttributes.forEach(attr => {
					lmnt.removeAttribute(attr)
				})
			}
			element.events.forEach(event => {
				lmnt.removeEventListener(event.trigger, event.action)
			})
		})
    })
}




export { LoadHTML, SetUpEditor, UndoEditor};
