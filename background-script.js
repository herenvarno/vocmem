var portFromCS;


function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}


browser.menus.create({
  id: "modify",
  title: "VocMem: On/Off",
  contexts: ["all"],
}, onCreated);


browser.menus.onClicked.addListener(function(info, tab) {
	if (info.menuItemId == "modify") {
		portFromCS.postMessage({greeting: "they clicked the menu!"});
	}
});

function connected(p) {
  portFromCS = p;
}

browser.runtime.onConnect.addListener(connected);
