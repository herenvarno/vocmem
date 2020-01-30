function findAndReplace(searchText, replacement, searchNode) {
    if (!searchText || typeof replacement === 'undefined') {
        // Throw error here if you want...
        return;
    }
    var regex = typeof searchText === 'string' ?
                new RegExp(searchText, 'g') : searchText,
        childNodes = (searchNode || document.body).childNodes,
        cnLength = childNodes.length,
        excludes = 'html,style,title,link,script,object,iframe,input,textarea,button';
    while (cnLength--) {
        var currentNode = childNodes[cnLength];
        if (currentNode.nodeType === 1 &&
            (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) {
            arguments.callee(searchText, replacement, currentNode);
        }
		if (currentNode.nodeType === 'div' && currentNode.className === 'vocmen_tooltip')
		{
			continue;
		}
        if (currentNode.nodeType !== 3 || !regex.test(currentNode.data) ) {
            continue;
        }
        var parent = currentNode.parentNode,
            frag = (function(){
                var html = currentNode.data.replace(regex, replacement),
                    wrap = document.createElement('div'),
                    frag = document.createDocumentFragment();
                wrap.innerHTML = html;
                while (wrap.firstChild) {
                    frag.appendChild(wrap.firstChild);
                }
                return frag;
            })();
        parent.insertBefore(frag, currentNode);
        parent.removeChild(currentNode);
    }
}

function inject_css (){

  var link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  link.href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";

  var style = document.createElement('style');
  style.innerHTML = `

.vocmem_tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 2px dotted  #FF5733;
}

.vocmem_tooltip .vocmem_tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;
  opacity: 0;
  transition: opacity 0.3s;
}

.vocmem_tooltip .vocmem_tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

.vocmem_tooltip:hover .vocmem_tooltiptext {
  visibility: visible;
  opacity: 1;
}

#vocmem_console label {
  margin: 2px;
}

#vocmem_console input[type=text], select, textarea {
  margin: 2px;
  width: 160px;
  padding: 12px;
  border: 1px solid #ccc;
  resize: vertical;
  box-sizing: border-box;
}
#vocmem_console button {
  margin: 2px;
  width: 46%;
  background-color: #4CAF50;
  color: white;
  padding: 12px 20px;
  border: none;
  cursor: pointer;
}
#vocmem_console button:hover {
  background-color: #45a049;
}
#vocmem_console {
  display:none;
  font-size: 12px;
  z-index: 100;
  width: 250px;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  background-color: #f2f2f2;
  padding: 20px;
  box-sizing: border-box;
  position: fixed;
  top: 50%;
  right: 0px;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
}
#vocmem_console .row:after {
  content: "";
  display: table;
  clear: both;
  box-sizing: border-box;
}
#vocmem_console .icon{
  right: 50px;
  margin-left: -2px;
  padding: 10px;
  background: #4CAF50;
  color: white;
  min-width: 30px;
  text-align: center;
  resize: vertical;
  padding: 15px 10px;
  width: 40px;
}
  `;
  document.head.appendChild(style);

var modal_dialog = document.createElement('div');
  modal_dialog.innerHTML = `
  <div>
  <div class="row">
      <label>VocMem: <span id="dict" style="color:red">0</span> word(s) loaded!</label>
  </div>
  <div class="row">
      <input type="text" id="word" name="firstname" placeholder="New word ..."><button id="btn_copy" class="icon">C</button>
  </div>
  <div class="row">
      <input type="text" id="trans" name="lastname" placeholder="Translation ..."><button id="btn_search" class="icon">S</button>
  </div>
  <div class="row">
    <button id="change">Add</button>
    <button id="delete">Delete</button>
    </div>
    <div class="row">
    <button id="load">Load</button>
    <button id="save">Save</button>
  </div>
  </div>
`
modal_dialog.id="vocmem_console";
document.body.appendChild(modal_dialog);

}


//alert("aaaaaaaa");

inject_css();

var dictionary = {};
var counter=Math.random();

const _translate = {

    // Translate source url
    translateSourceUrl: "https://translate.googleapis.com/translate_a/single?client=gtx&sl={SOURCE_LANG}&tl={TARGET_LANG}&dt=t&q={TEXT}",

    /**
     * Encapsulation
     *
     * @returns {string}
     */
    getTranslateSourceUrl: function () {
        return this.translateSourceUrl;
    },

    /**
     * Merge all sentences
     *
     * @returns {string}
     */
    mergeSentences: function (data) {
        return data.map(function(item) { return item[0]; }).join("");
    },

    /**
     * Generate google translate link
     *
     * @param text
     * @param target
     * @param source
     * @returns {string}
     */
    generatePostUrl: function (text, target, source) {
        return this.getTranslateSourceUrl()
            .replace("{SOURCE_LANG}", source)
            .replace("{TARGET_LANG}", target)
            .replace("{TEXT}", encodeURI(text))
            .toString();
    },

    /**
     * Translate from google translate
     *
     * @param text
     * @param target
     * @param source
     * @returns {Promise}
     */
    translateText: function (text, target, source) {
        if(text === "") return "";

        let sourceLang = source ? source : 'auto';
        let targetLang = target ? target : 'tr';

        // Generate post url with query string
        let queryString = this.generatePostUrl(text, targetLang, sourceLang);

        let _this = this;
        return fetch(queryString)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                return {
                    sourceLang: data[2],
                    targetLang: targetLang,
                    originalText: text,
                    text: _this.mergeSentences(data[0]),
                };
            })
            .catch(function (error) {
                console.log("Error:" + error);
                return Promise.reject(Error(error))
            });
    }
};



function update_textarea(){

	document.getElementById("dict").innerHTML = "" + Object.keys(dictionary).length;

	for(var k in dictionary)
	{
		var searchTerm = new RegExp("([\\s!-#%-*,-/\\:;?@\\[-\\]_\\{\\}\\u00A1\\u00A7\\u00AB\\u00B6\\u00B7\\u00BB\\u00BF\\u037E\\u0387\\u055A-\\u055F\\u0589\\u058A\\u05BE\\u05C0\\u05C3\\u05C6\\u05F3\\u05F4\\u0609\\u060A\\u060C\\u060D\\u061B\\u061E\\u061F\\u066A-\\u066D\\u06D4\\u0700-\\u070D\\u07F7-\\u07F9\\u0830-\\u083E\\u085E\\u0964\\u0965\\u0970\\u0AF0\\u0DF4\\u0E4F\\u0E5A\\u0E5B\\u0F04-\\u0F12\\u0F14\\u0F3A-\\u0F3D\\u0F85\\u0FD0-\\u0FD4\\u0FD9\\u0FDA\\u104A-\\u104F\\u10FB\\u1360-\\u1368\\u1400\\u166D\\u166E\\u169B\\u169C\\u16EB-\\u16ED\\u1735\\u1736\\u17D4-\\u17D6\\u17D8-\\u17DA\\u1800-\\u180A\\u1944\\u1945\\u1A1E\\u1A1F\\u1AA0-\\u1AA6\\u1AA8-\\u1AAD\\u1B5A-\\u1B60\\u1BFC-\\u1BFF\\u1C3B-\\u1C3F\\u1C7E\\u1C7F\\u1CC0-\\u1CC7\\u1CD3\\u2010-\\u2027\\u2030-\\u2043\\u2045-\\u2051\\u2053-\\u205E\\u207D\\u207E\\u208D\\u208E\\u2308-\\u230B\\u2329\\u232A\\u2768-\\u2775\\u27C5\\u27C6\\u27E6-\\u27EF\\u2983-\\u2998\\u29D8-\\u29DB\\u29FC\\u29FD\\u2CF9-\\u2CFC\\u2CFE\\u2CFF\\u2D70\\u2E00-\\u2E2E\\u2E30-\\u2E42\\u3001-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u3030\\u303D\\u30A0\\u30FB\\uA4FE\\uA4FF\\uA60D-\\uA60F\\uA673\\uA67E\\uA6F2-\\uA6F7\\uA874-\\uA877\\uA8CE\\uA8CF\\uA8F8-\\uA8FA\\uA8FC\\uA92E\\uA92F\\uA95F\\uA9C1-\\uA9CD\\uA9DE\\uA9DF\\uAA5C-\\uAA5F\\uAADE\\uAADF\\uAAF0\\uAAF1\\uABEB\\uFD3E\\uFD3F\\uFE10-\\uFE19\\uFE30-\\uFE52\\uFE54-\\uFE61\\uFE63\\uFE68\\uFE6A\\uFE6B\\uFF01-\\uFF03\\uFF05-\\uFF0A\\uFF0C-\\uFF0F\\uFF1A\\uFF1B\\uFF1F\\uFF20\\uFF3B-\\uFF3D\\uFF3F\\uFF5B\\uFF5D\\uFF5F-\\uFF65])("+k+")([\\s!-#%-*,-/\\:;?@\\[-\\]_\\{\\}\\u00A1\\u00A7\\u00AB\\u00B6\\u00B7\\u00BB\\u00BF\\u037E\\u0387\\u055A-\\u055F\\u0589\\u058A\\u05BE\\u05C0\\u05C3\\u05C6\\u05F3\\u05F4\\u0609\\u060A\\u060C\\u060D\\u061B\\u061E\\u061F\\u066A-\\u066D\\u06D4\\u0700-\\u070D\\u07F7-\\u07F9\\u0830-\\u083E\\u085E\\u0964\\u0965\\u0970\\u0AF0\\u0DF4\\u0E4F\\u0E5A\\u0E5B\\u0F04-\\u0F12\\u0F14\\u0F3A-\\u0F3D\\u0F85\\u0FD0-\\u0FD4\\u0FD9\\u0FDA\\u104A-\\u104F\\u10FB\\u1360-\\u1368\\u1400\\u166D\\u166E\\u169B\\u169C\\u16EB-\\u16ED\\u1735\\u1736\\u17D4-\\u17D6\\u17D8-\\u17DA\\u1800-\\u180A\\u1944\\u1945\\u1A1E\\u1A1F\\u1AA0-\\u1AA6\\u1AA8-\\u1AAD\\u1B5A-\\u1B60\\u1BFC-\\u1BFF\\u1C3B-\\u1C3F\\u1C7E\\u1C7F\\u1CC0-\\u1CC7\\u1CD3\\u2010-\\u2027\\u2030-\\u2043\\u2045-\\u2051\\u2053-\\u205E\\u207D\\u207E\\u208D\\u208E\\u2308-\\u230B\\u2329\\u232A\\u2768-\\u2775\\u27C5\\u27C6\\u27E6-\\u27EF\\u2983-\\u2998\\u29D8-\\u29DB\\u29FC\\u29FD\\u2CF9-\\u2CFC\\u2CFE\\u2CFF\\u2D70\\u2E00-\\u2E2E\\u2E30-\\u2E42\\u3001-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u3030\\u303D\\u30A0\\u30FB\\uA4FE\\uA4FF\\uA60D-\\uA60F\\uA673\\uA67E\\uA6F2-\\uA6F7\\uA874-\\uA877\\uA8CE\\uA8CF\\uA8F8-\\uA8FA\\uA8FC\\uA92E\\uA92F\\uA95F\\uA9C1-\\uA9CD\\uA9DE\\uA9DF\\uAA5C-\\uAA5F\\uAADE\\uAADF\\uAAF0\\uAAF1\\uABEB\\uFD3E\\uFD3F\\uFE10-\\uFE19\\uFE30-\\uFE52\\uFE54-\\uFE61\\uFE63\\uFE68\\uFE6A\\uFE6B\\uFF01-\\uFF03\\uFF05-\\uFF0A\\uFF0C-\\uFF0F\\uFF1A\\uFF1B\\uFF1F\\uFF20\\uFF3B-\\uFF3D\\uFF3F\\uFF5B\\uFF5D\\uFF5F-\\uFF65])", 'gi');
		findAndReplace(searchTerm ,"$1<div class='vocmem_tooltip'>$2<span class='vocmem_tooltiptext'>"+dictionary[k]+"</span></div>$3", document.body);
	}
}


function save_dict() {
  browser.storage.sync.set({dictionary: dictionary})
	.then(function(){
		console.log("OK");
	},
	function(){
		console.log("ERR");	
	});
}

function load_dict() {
  var gettingItem = browser.storage.sync.get('dictionary');
  gettingItem.then((res) => {
	console.log(res);
    dictionary = res.dictionary;
	update_textarea();
  });
}

function change_dict(){
	word = document.getElementById("word").value;
	trans = document.getElementById("trans").value;
	if(word && trans){
		dictionary[word]=trans;
		update_textarea();
	}
}

function delete_word(){
	word = document.getElementById("word").value;
	if(word){
		delete dictionary[word];
		update_textarea();
	}
}

function fill_trans(){
	var text=document.getElementById("word").value;
	if(text){
		_translate.translateText(text, "en", "sv").then(function(data){
		  document.getElementById("trans").value=data.text;
		});
	}
}

function fill_word(){
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
	if(text){
		document.getElementById("word").value=text;
        fill_trans();
	}
}




document.onload = load_dict;
document.getElementById("save").addEventListener("click", save_dict);
document.getElementById("change").addEventListener("click", change_dict);
document.getElementById("load").addEventListener("click", load_dict);
document.getElementById("delete").addEventListener("click", delete_word);
document.getElementById("btn_copy").addEventListener("click", fill_word);
document.getElementById("btn_search").addEventListener("click", fill_trans);

let myPort = browser.runtime.connect({name:"port-from-cs"});
myPort.onMessage.addListener(function(m) {
    var foo = document.getElementById('vocmem_console');
   if(foo.style.display == '' || foo.style.display == 'none'){
        foo.style.display = 'block';
   }
   else {
        foo.style.display = 'none';
   }
});

