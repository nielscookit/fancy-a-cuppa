/* Fancy a Cuppa: community catalog API, development only. */
(()=>{
"use strict";
const root="https://zfkiiqqyapahxirguxgj.supabase.co";
const key="sb_publishable_Fsijwz4MapCz77S2xDuPKQ_hnAXzaU7";
async function list(){
const url=root+"/rest/v1/teas?select=id,brand,name,category,subcategory,subcategory_other,tea_preparations(dose_teaspoons,dose_grams,dose_bags,dose_measures,dose_water_ml,brew_seconds,water_temp_c)&status=eq.published&order=created_at.desc&limit=500";
const res=await fetch(url,{headers:{apikey:key}});
if(!res.ok)throw Error("Cloud catalog unavailable ("+res.status+")");
return (await res.json()).flatMap(t=>{
const p=Array.isArray(t.tea_preparations)?t.tea_preparations[0]:t.tea_preparations;
if(!p)return [];
const unit=p.dose_bags!=null?"bag":p.dose_teaspoons!=null?"tsp":p.dose_grams!=null?"g":p.dose_measures!=null?"measure":null;
if(!unit)return [];
const qty=Number(unit==="bag"?p.dose_bags:unit==="tsp"?p.dose_teaspoons:unit==="g"?p.dose_grams:p.dose_measures);
return [{id:"cloud-"+t.id,name:t.brand==="Unbekannt"?t.name:t.brand+" · "+t.name,
type:unit==="bag"?"bag":"loose",unit,dose:qty*1000/Number(p.dose_water_ml),
brand:t.brand,rawName:t.name,category:t.category||"other",subcategory:t.subcategory||"other",subcategory_other:t.subcategory_other||"",qty,base:Number(p.dose_water_ml),temperature:p.water_temp_c,
min:Math.max(1,Math.round(Number(p.brew_seconds)/60)),provisional:false}];
});
}
async function save(data){
 const {name,brand,category,subcategory,subcategory_other,type,qty,base,mins,temperature,unit,code,id}=data;
 if(!name?.trim()||!brand?.trim()||!category||!subcategory)throw Error("Please complete the tea identity fields.");
 if(type==="bag"&&unit!=="bag"||type==="loose"&&unit==="bag")throw Error("Dosage unit does not match tea format.");
 if(!["tsp","g","bag","measure"].includes(unit))throw Error("Unknown dosage unit.");
 const payload={action:id?"update":"create",id:id||null,brand,name,category,subcategory,subcategory_other:subcategory==="other"?subcategory_other||null:null,
 leaf_style:type==="bag"?"bag":"other",dose_unit:unit,dose_quantity:qty,
 brew_seconds:Math.round(mins*60),dose_water_ml:base,water_temp_c:temperature??null,
 dose_teaspoons:unit==="tsp"?qty:null,dose_grams:unit==="g"?qty:null,
 dose_measures:unit==="measure"?qty:null,dose_bags:unit==="bag"?qty:null,
 code_type:code?.type||null,code_value:code?.value||null};
 const res=await fetch(root+"/functions/v1/community-tea",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const result=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(result.error||"Cloud saving failed ("+res.status+")");
 return result;
}
async function lookup(code){
if(!code?.type||!code?.value)return null;
const url=root+"/rest/v1/tea_codes?select=tea_id,teas(id,brand,name,category,subcategory,subcategory_other,tea_preparations(dose_teaspoons,dose_grams,dose_bags,dose_measures,dose_water_ml,brew_seconds,water_temp_c))&code_type=eq."+encodeURIComponent(code.type)+"&code_value=eq."+encodeURIComponent(code.value)+"&limit=1";
const response=await fetch(url,{headers:{apikey:key}});
if(!response.ok)throw Error("Catalog lookup unavailable ("+response.status+")");
const data=await response.json();
if(!data.length||!data[0].teas)return null;
const t=data[0].teas;
const p=Array.isArray(t.tea_preparations)?t.tea_preparations[0]:t.tea_preparations;
if(!p)return null;
const unit=p.dose_bags!=null?"bag":p.dose_teaspoons!=null?"tsp":p.dose_grams!=null?"g":p.dose_measures!=null?"measure":null;
if(!unit)return null;
const qty=Number(unit==="bag"?p.dose_bags:unit==="tsp"?p.dose_teaspoons:unit==="g"?p.dose_grams:p.dose_measures);
return {id:"cloud-"+t.id,name:t.brand==="Unbekannt"?t.name:t.brand+" · "+t.name,
type:unit==="bag"?"bag":"loose",unit,dose:qty*1000/Number(p.dose_water_ml),
brand:t.brand,rawName:t.name,category:t.category||"other",subcategory:t.subcategory||"other",subcategory_other:t.subcategory_other||"",qty,base:Number(p.dose_water_ml),temperature:p.water_temp_c,
min:Math.max(1,Math.round(Number(p.brew_seconds)/60)),provisional:false};
}
window.FancyCloud={list,save,lookup};
})();