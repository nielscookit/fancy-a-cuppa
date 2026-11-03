/* Form-only dropdowns: controlled flyout dimensions on iPhone while retaining native select state. */
(()=>{
"use strict";
const ids=["freeCategory","freeSubcategory","freeType","freeUnit","scanCategory","scanSubcategory","scanType","scanUnit"];
const instances=new Map();
let openId=null;
function close(){
 if(!openId)return;
 const x=instances.get(openId);
 if(x){x.menu.hidden=true;x.trigger.setAttribute("aria-expanded","false");}
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
 x.menu.hidden=false;x.trigger.setAttribute("aria-expanded","true");openId=id;
 const current=x.menu.querySelector('[aria-selected="true"]');
 current?.scrollIntoView({block:"nearest"});
}
function install(){
 for(const id of ids){
  const select=document.getElementById(id);
  if(!select||instances.has(id))continue;
  const wrapper=document.createElement("span");wrapper.className="fc-dropdown-wrap";
  select.parentNode.insertBefore(wrapper,select);
  wrapper.append(select);
  select.classList.add("fc-native-select");
  const trigger=document.createElement("button");trigger.type="button";
  trigger.className="fc-dropdown-trigger";
  trigger.setAttribute("aria-haspopup","listbox");
  trigger.setAttribute("aria-expanded","false");
  const label=wrapper.closest("label")?.querySelector(".field-label")?.textContent||"Choose option";
  trigger.setAttribute("aria-label",label);
  const caption=document.createElement("span");caption.className="fc-dropdown-caption";
  const chevron=document.createElement("span");chevron.className="material-symbols-outlined";chevron.setAttribute("aria-hidden","true");
  chevron.textContent="keyboard_arrow_down";
  trigger.append(caption,chevron);
  const menu=document.createElement("span");menu.className="fc-dropdown-menu";menu.hidden=true;menu.setAttribute("role","listbox");
  menu.setAttribute("aria-label",label);
  wrapper.append(trigger,menu);
  instances.set(id,{select,trigger,caption,menu});
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
  if(openId&&!e.target.closest(".fc-dropdown-wrap"))close();
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
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