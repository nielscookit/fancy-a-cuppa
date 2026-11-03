/* Fancy a Cuppa: iPhone-compatible barcode reader for photographed packaging. */
(()=>{
"use strict";
const source="https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.4/dist/iife/reader/index.js";
let loading=null;
function load(){
 if(window.ZXingWASM?.readBarcodes)return Promise.resolve(window.ZXingWASM);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src=source;
  script.onload=()=>window.ZXingWASM?.readBarcodes?resolve(window.ZXingWASM):reject(Error("Barcode library unavailable"));
  script.onerror=()=>reject(Error("Barcode library could not be loaded"));
  document.head.appendChild(script);
 }).catch(e=>{loading=null;throw e;});
 return loading;
}
function normalize(result){
 const format=String(result.format||"").toLowerCase().replace(/[^a-z0-9]/g,"");
 let type=null;
 if(format==="ean13")type="ean_13";
 else if(format==="ean8")type="ean_8";
 else if(format==="upca")type="upc_a";
 else if(format==="gtin14")type="gtin_14";
 else if(format==="qrcode")type="qr";
 else return null;
 const value=String(result.text||"").trim();
 if(!value||value.length>512)return null;
 if(type!=="qr"&&!/^\d+$/.test(value))return null;
 // Some scanners normalize UPC-A barcodes to EAN-13 by adding a leading zero.
 if(type==="ean_13"&&value.length===13&&value.startsWith("0"))return {type:"upc_a",value:value.slice(1)};
 return {type,value};
}
async function scan(file){
 if(!file)return null;
 const reader=await load();
 const options={tryHarder:true,formats:["EAN13","EAN8","UPCA","QRCode"],maxNumberOfSymbols:5};
 let results=[];
 try{results=await reader.readBarcodes(file,options);}catch(firstError){
   // Canvas conversion helps with camera formats the decoder cannot read directly.
   const bitmap=await createImageBitmap(file);
   try{
     const scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));
     const canvas=document.createElement("canvas");
     canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
     const ctx=canvas.getContext("2d",{willReadFrequently:true});
     ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
     results=await reader.readBarcodes(ctx.getImageData(0,0,canvas.width,canvas.height),options);
   }finally{bitmap.close?.();}
 }
 return results.map(normalize).find(Boolean)||null;
}
window.FancyBarcode={scan};
})();