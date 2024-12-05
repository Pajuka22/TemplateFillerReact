const paramregex = /{{[^({})]+}}/g

const UpdateParams = (params, SetParams) => {
    let newparams = {};
    Object.keys(params).forEach(key => {
      newparams[key] = [...params[key]];
    })
    SetParams(newparams)
}

function DetectParams(element, value, paramsRef, SetParams) {
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

function DetectParamsGlobal(SetParams, editableElements) {

    let newparams = {}
    editableElements.forEach(element => {
        element.attrs.forEach(attr => {
            element.list.forEach(lmnt => {
                let foundparams = [...lmnt[attr].matchAll(paramregex)]
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
    })
    SetParams(newparams)
}
const RenameParam = (params, oldname, newname, SetParams) => {
    if (params[oldname] == null) return;
    if (newname == null || newname.trim() == "") return;

    params[oldname].forEach(element => {
        const editorAttributes = element.editorAttributes
        if (editorAttributes !== undefined) {
            for (let i = 0; i < editorAttributes.length; ++i) {
            const attr = editorAttributes[i];
            element.setAttribute(attr, element.getAttribute(attr).replaceAll(`{{${oldname}}}`, `{{${newname}}}`))
            }
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
            params[newname] = params[newname].concat(params[oldname])
        }
    delete params[oldname]
    UpdateParams(params, SetParams)
}

export {DetectParams, DetectParamsGlobal, RenameParam, UpdateParams };  