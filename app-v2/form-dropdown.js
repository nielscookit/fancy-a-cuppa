/* Form-only dropdowns: controlled flyout dimensions on iPhone while retaining native select state. */
(()=>{
"use strict";
const ids=["freeCategory","freeSubcategory","freeType","freeUnit","scanCategory","scanSubcategory","scanType","scanUnit"];
const instances=new Map();
let openId=null;
const GAP=4,EDGE=12,MAX_HEIGHT=360;
function positionMenu(){
 if(!openId)return;
 const x=instances.get(openId);if(!x||x.menu.hidden)return;
 const rect=x.trigger.getBoundingClientRect();
 const viewport=window.visualViewport;
 const top=viewport?viewport.offsetTop:0;
 const bottom=top+(viewport?viewport.height:window.innerHeight);
 const availableBelow=Math.max(0,bottom-EDGE-rect.bottom-GAP);
 const availableAbove=Math.max(0,rect.top-top-EDGE-GAP);
 const contentHeight=x.menu.scrollHeight;
 const preferred=Math.min(contentHeight,MAX_HEIGHT);
 const below=availableBelow>=preferred || availableBelow>=availableAbove;
 const space=below?availableBelow:availableAbove;
 const height=Math.max(0,Math.min(preferred,space));
 const menuTop=below?rect.bottom+GAP:rect.top-GAP-height;
 const menu=x.menu;
 menu.style.setProperty("position","fixed","important");
 menu.style.setProperty("top",Math.max(top+EDGE,menuTop)+"px","important");
 menu.style.setProperty("left",rect.left+"px","important");
 menu.style.setProperty("right","auto","important");
 menu.style.setProperty("width",rect.width+"px","important");
 menu.style.setProperty("max-width",rect.width+"px","important");
 menu.style.setProperty("max-height",height+"px","important");
 menu.style.setProperty("z-index","1000","important");
 menu.dataset.placement=below?"bottom":"top";
}

function close(){
 if(!openId)return;
 const x=instances.get(openId);
 if(x){
  x.menu.hidden=true;
  x.trigger.setAttribute("aria-expanded","false");
  x.wrapper.append(x.menu);
  x.menu.removeAttribute("style");
}
 openId=null;
}
function sync(id){
 const x=instances.get(id);if(!x)return;
 const selected=x.select.selectedOptions[0];
 x.caption.textContent=selected?.textContent||"Choose an option";
 x.trigger.disabled=x.select.disabled;
}
function refresh(){for(const id of ids)sync(id);}
function open(id){
 if(openId===id){close();return;}
 close();
 const x=instances.get(id);if(!x||x.select.disabled)return;
 sync(id);
 x.menu.replaceChildren();
 for(const opt of x.select.options){
  if(opt.hidden||opt.disabled)continue;
  const choice=document.createElement("button");
  choice.type="button";
  choice.className="fc-dropdown-option";
  choice.setAttribute("role","option");
  choice.setAttribute("aria-selected",String(opt.value===x.select.value));
  choice.textContent=opt.textContent;
  choice.addEventListener("click",e=>{
   e.preventDefault();e.stopPropagation();
   x.select.value=opt.value;
   x.select.dispatchEvent(new Event("change",{bubbles:true}));
   refresh();close();x.trigger.focus();
  });
  x.menu.append(choice);
 }
 document.body.append(x.menu);
 x.menu.hidden=false;x.trigger.setAttribute("aria-expanded","true");openId=id;
 positionMenu();
 const current=x.menu.querySelector('[aria-selected="true"]');
 if(current){
   const box=x.menu;
   const start=current.offsetTop;
   const end=start+current.offsetHeight;
   if(start<box.scrollTop)box.scrollTop=start;
   else if(end>box.scrollTop+box.clientHeight)box.scrollTop=end-box.clientHeight;
 }
}
function install(){
 for(const id of ids){
  const select=document.getElementById(id);
  if(!select||instances.has(id))continue;
  // Do not leave the select inside a native <label>: iOS can forward taps to
  // its hidden select and still open the system picker.
  const parentLabel=select.closest("label");
  if(parentLabel){
    const field=document.createElement("div");
    field.className="fc-form-field";
    while(parentLabel.firstChild)field.appendChild(parentLabel.firstChild);
    parentLabel.replaceWith(field);
  }
  const wrapper=document.createElement("span");wrapper.className="fc-dropdown-wrap";
  select.parentNode.insertBefore(wrapper,select);
  wrapper.append(select);
  select.classList.add("fc-native-select");
  const trigger=document.createElement("button");trigger.type="button";
  trigger.className="fc-dropdown-trigger";
  trigger.setAttribute("aria-haspopup","listbox");
  trigger.setAttribute("aria-expanded","false");
  const label=wrapper.closest(".fc-form-field")?.querySelector(".field-label")?.textContent||"Choose option";
  trigger.setAttribute("aria-label",label);
  const caption=document.createElement("span");caption.className="fc-dropdown-caption";
  const chevron=document.createElement("span");chevron.className="material-symbols-outlined";chevron.setAttribute("aria-hidden","true");
  chevron.textContent="keyboard_arrow_down";
  trigger.append(caption,chevron);
  const menu=document.createElement("span");menu.className="fc-dropdown-menu";menu.hidden=true;menu.setAttribute("role","listbox");
  menu.setAttribute("aria-label",label);
  wrapper.append(trigger,menu);
  instances.set(id,{select,trigger,caption,menu,wrapper});
  trigger.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open(id);});
  trigger.addEventListener("keydown",e=>{
   if(e.key==="Escape"){close();e.preventDefault();}
   if(e.key==="ArrowDown"||e.key==="Enter"||e.key===" "){
    e.preventDefault();if(openId!==id)open(id);
    xFocus(1);
   }
  });
  menu.addEventListener("keydown",e=>{
   if(e.key==="Escape"){close();trigger.focus();e.preventDefault();}
   else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();xFocus(e.key==="ArrowDown"?1:-1);}
  });
  select.addEventListener("change",refresh);
  new MutationObserver(()=>sync(id)).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:["disabled","hidden"]});
  sync(id);
 }
 document.addEventListener("pointerdown",e=>{
  if(openId&&!e.target.closest(".fc-dropdown-wrap")&&!e.target.closest(".fc-dropdown-menu"))close();
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 window.addEventListener("resize",positionMenu);
 window.addEventListener("scroll",positionMenu,true);
 window.visualViewport?.addEventListener("resize",positionMenu);
 window.visualViewport?.addEventListener("scroll",positionMenu);
}
function xFocus(direction){
 if(!openId)return;
 const choices=[...instances.get(openId).menu.querySelectorAll(".fc-dropdown-option")];
 if(!choices.length)return;
 let idx=choices.indexOf(document.activeElement);
 idx=Math.max(0,Math.min(choices.length-1,idx+direction));
 choices[idx].focus();
}
window.FancyDropdown={install,refresh,close};
})();