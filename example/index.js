
let editor;

document.addEventListener("DOMContentLoaded", () => {

    editor = document.getElementById('node-editor');

    const getFile = (path, callback) => {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                callback(this.responseText);
            }
        };
        xhttp.open("GET", path);
        xhttp.send(); 
    }
    
    getFile('math-data.json', (response) => {
        editor.data = response;
    })
    getFile('nodes.json', (response) => {
        editor.nodes = response;
    })

    let init = false;
    let trace = document.getElementById('trace');
    const canvas = document.getElementById('preview');
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const updatePreview = () => {
        if (init) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.clearRect(0, 0, w, h);

            let data = JSON.parse(editor.export());
            let finalNode = getFinalNode(data);
            let traceValue = getValueOfNode(finalNode, data);

            let f = (x) => 0;
            if (traceValue) {
                trace.innerHTML = `Traced: ${traceValue}`;
                f = (x) => eval(traceValue.replace('x', `(${x})`));
            }

            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            let iter = 500;
            for (let x = 1; x < iter; x++) {
                ctx.moveTo((x-1) * w / iter, h - f(x-1 - iter/2));
                ctx.lineTo((x) * w / iter, h - f(x - iter/2));
            }
            ctx.stroke(); 
        }
    };
    
    editor.addEventListener('OnInit', () => {
        init = true;
        updatePreview();
    });
    editor.addEventListener('OnDataLoaded', updatePreview);
    editor.addEventListener('OnDeleteNode', updatePreview);
    editor.addEventListener('OnConnectNode', updatePreview);
    editor.addEventListener('OnDisconnectNode', updatePreview);
    editor.addEventListener('OnValueNodeInput', updatePreview);
});

function getFinalNode(nodes) {
    for (let node of nodes) {
        if (node.type == 'result-node' && node.inputs.length == 1) {
            // Connected Result node
            return node;
        }
    }
}

function getValueOfNode(node={}, data={}) {
    if (node.values) {
        let value = node.values[0].text;
        if (value == null || value == undefined || value == '') {
            return 0;
        }
        return value;
    } else {
        switch (node.type) {
            case 'start-node':
                return 'x';
            case 'result-node':
                return getValueOfNode(getNodeWithId(node.inputs.pop().target, data), data);
            case 'add-node':
                return `(${node.inputs.map(v => 
                            getValueOfNode(getNodeWithId(v.target, data), data)
                        ).join('+')})`;
            case 'subtract-node':
                return `(${node.inputs.map(v => 
                            getValueOfNode(getNodeWithId(v.target, data), data)
                        ).join('-')})`;
            case 'multiply-node':
                return `(${node.inputs.map(v => 
                            getValueOfNode(getNodeWithId(v.target, data), data)
                        ).join('*')})`;
            case 'divide-node':
                return `(${node.inputs.map(v => 
                            getValueOfNode(getNodeWithId(v.target, data), data)
                        ).join('/')})`;
            case 'power-node':
                return `(${node.inputs.map(v => 
                            getValueOfNode(getNodeWithId(v.target, data), data)
                        ).join('**')})`;
        }
    }
}

function getNodeWithId(targetId, data) {
    let match = data.flatMap(n => n.inputs.concat(n.outputs)).filter(v => v.id == targetId);
    if (match.length >= 1) { 
        return data.filter(n => n.id == match[0].parent).pop();
    }
}

function exportNodes() {
    download('data.json', editor.export());
}

function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}