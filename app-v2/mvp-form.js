/* Shared dynamic editor: used by manual entry, scan results, and explicit edit. */
(()=>{
"use strict";
const subs={
black:["Assam","Darjeeling","Ceylon","Earl Grey","English Breakfast","Sonstige"],
green:["Sencha","Bancha","Gunpowder","Gyokuro","Matcha","Sonstige"],
white:["Silver Needle","Bai Mu Dan","Shou Mei","Sonstige"],
oolong:["Oolong","Sonstige"],
fruit:["Beeren","Apfel","Zitrus","Mischung","Sonstige"],
herbal:["Pfefferminze","Kamille","Fenchel","Mischung","Sonstige"],
rooibos:["Natur","Aromatisiert","Sonstige"],
other:["Sonstige"]
};
const get=(p,k)=>document.getElementById(p+k);
function update(p,subcategory){
 const category=get(p,"Category").value;
 const selector=get(p,"Subcategory");
 const old=subcategory||selector.value;
 selector.replaceChildren(new Option("Sorte auswählen",""));
 for(const name of (subs[category]||[]))selector.add(new Option(name,name==="Sonstige"?"other":name));
 selector.value=[...selector.options].some(x=>x.value===old)?old:"";
 get(p,"OtherWrap").hidden=selector.value!=="other";
}
function typeChange(p,preferred){
 const bag=get(p,"Type").value==="bag";
 const unit=get(p,"Unit");
 [...unit.options].forEach(opt=>{
 if(!opt.value)return;
 opt.disabled=bag?opt.value!=="bag":opt.value==="bag";
 opt.hidden=opt.disabled;
 });
 const desired=preferred||unit.value;
 unit.value=bag?"bag":desired==="bag"||!desired?"tsp":desired;
}
function setup(p){
 get(p,"Category").addEventListener("change",()=>update(p));
 get(p,"Subcategory").addEventListener("change",()=>get(p,"OtherWrap").hidden=get(p,"Subcategory").value!=="other");
 get(p,"Type").addEventListener("change",()=>typeChange(p));
 update(p);typeChange(p);
}
function read(p){
 const v=k=>get(p,k).value.trim();
 return {name:v("Name"),brand:v("Brand"),category:v("Category"),
 subcategory:v("Subcategory"),subcategory_other:v("Subcategory")==="other"?v("Other"):"",
 type:v("Type"),unit:v("Unit"),qty:Number(v("Dose")),base:Number(v("Base")),
 mins:Number(v("Min")),temperature:v("Temp")===""?null:Number(v("Temp"))};
}
function validate(p){
 const d=read(p);
 const fail=(k,message)=>{get(p,k).focus();throw Error(message);};
 for(const [k,v] of [["Name",d.name],["Brand",d.brand],["Category",d.category],["Subcategory",d.subcategory],["Unit",d.unit]]){
   if(!v)fail(k,"Please complete all required fields.");
 }
 if(d.subcategory==="other"&&!d.subcategory_other)fail("Other","Please specify the tea variety.");
 if(!Number.isFinite(d.qty)||d.qty<=0||d.qty>100)fail("Dose","Check tea quantity (0–100).");
 if(!Number.isInteger(d.base)||d.base<50||d.base>5000)fail("Base","Water quantity must be 50–5000 ml.");
 if(!Number.isInteger(d.mins)||d.mins<1||d.mins>30)fail("Min","Brewing time must be 1–30 whole minutes.");
 if(d.temperature!==null&&(!Number.isInteger(d.temperature)||d.temperature<40||d.temperature>100))fail("Temp","Temperature must be 40–100 °C.");
 if((d.type==="bag")!==(d.unit==="bag"))fail("Unit","Choose a suitable unit for tea format.");
 return d;
}
function fill(p,d={}){
 for(const [k,v] of [["Name",d.name],["Brand",d.brand],["Category",d.category],["Type",d.type],["Dose",d.qty],["Base",d.base],["Min",d.mins],["Temp",d.temperature]]){
   get(p,k).value=v??"";
 }
 update(p,d.subcategory||"");get(p,"Other").value=d.subcategory_other||"";
 get(p,"OtherWrap").hidden=d.subcategory!=="other";
 typeChange(p,d.unit||null);
}
window.FancyForm={setup,read,validate,fill};
})();