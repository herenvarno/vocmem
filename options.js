var config = {"source": "SV", "target": "EN"};

function update_display() {
  document.querySelector("#source").value=config["source"];
  document.querySelector("#target").value=config["target"];
}

function saveOptions(e) {
  e.preventDefault();
  var source = document.querySelector("#source").value;
  var target = document.querySelector("#target").value;
  if(source=="" || target=="" || source == target){
    alert("Illegal source or target language!");
    return;
  }
  config["source"] = source;
  config["target"] = target;
  browser.storage.sync.set({
    "config": config
  });
}

function restoreOptions() {

  function set_option(result) {
    config = result.config || {"source": "SV", "target": "EN"};
	update_display();
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get("config");
  getting.then(set_option, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#add").addEventListener("click", saveOptions);
