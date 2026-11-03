/* Fancy a Cuppa: community catalog API, development only. */
(()=>{
"use strict";
const root="https://zfkiiqqyapahxirguxgj.supabase.co";
const key="sb_publishable_Fsijwz4MapCz77S2xDuPKQ_hnAXzaU7";
async function list(){
const url=root+"/rest/v1/teas?select=id,brand,name,tea_preparations(dose_teaspoons,dose_grams,dose_bags,dose_water_ml,brew_seconds)&status=eq.published&order=created_at.desc&limit=500";
const res=await fetch(url,{headers:{apikey:key}});
if(!res.ok)throw Error("Cloud catalog unavailable ("+res.status+")");
return (await res.json()).flatMap(t=>{
const p=Array.isArray(t.tea_preparations)?t.tea_preparations[0]:t.tea_preparations;
if(!p)return [];
const unit=p.dose_bags!=null?"bag":p.dose_teaspoons!=null?"tsp":p.dose_grams!=null?"g":null;
if(!unit)return [];
const qty=Number(unit==="bag"?p.dose_bags:unit==="tsp"?p.dose_teaspoons:p.dose_grams);
return [{id:"cloud-"+t.id,name:t.brand==="Unbekannt"?t.name:t.brand+" · "+t.name,
type:unit==="bag"?"bag":"loose",unit,dose:qty*1000/Number(p.dose_water_ml),
min:Math.max(1,Math.round(Number(p.brew_seconds)/60)),provisional:false}];
});
}
async function save({name,type,qty,base,mins,unit}){
if(unit==="measure")throw Error("Please select teaspoons or grams instead of the manufacturer tea measure.");
if(!["tsp","g","bag"].includes(unit))throw Error("Please choose teaspoons, grams or tea bags.");
if(mins>30)throw Error("Shared catalog supports brewing times up to 30 minutes.");
const bits=name.split(/\s+[·|–-]\s+/);
const brand=bits.length>1?bits.shift().trim():"Unbekannt";
const title=bits.length?bits.join(" · ").trim():name;
const payload={brand,name:title,category:"other",leaf_style:type==="bag"?"bag":"other",
brew_seconds:mins*60,dose_water_ml:base,
dose_teaspoons:unit==="tsp"?qty:null,dose_grams:unit==="g"?qty:null,dose_bags:unit==="bag"?qty:null};
const res=await fetch(root+"/functions/v1/community-tea",{method:"POST",
headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
const result=await res.json().catch(()=>({}));
if(!res.ok)throw Error(result.error||"Cloud saving failed ("+res.status+")");
return result;
}
window.FancyCloud={list,save};
})();