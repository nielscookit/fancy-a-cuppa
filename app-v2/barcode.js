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
 try{results=await reader.readBarcodes(file,options);}catch(firstError){results=[];}
if(!results.length){
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

async function openCamera(onDetected,onPhoto){
 if(!navigator.mediaDevices?.getUserMedia){onPhoto();return;}
 const overlay=document.createElement("div");
 overlay.setAttribute("role","dialog");overlay.setAttribute("aria-label","Barcode camera scanner");
 Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"9999",background:"#131313",display:"flex",
 flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"14px",padding:"20px",
 color:"#fff",fontFamily:"system-ui,sans-serif"});
 const video=document.createElement("video");
 video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");
 video.muted=true;video.autoplay=true;
 Object.assign(video.style,{width:"100%",maxWidth:"560px",maxHeight:"65vh",objectFit:"cover",borderRadius:"14px"});
 const status=document.createElement("p");status.textContent="Point the camera at the barcode or QR code.";
 status.style.textAlign="center";
 const controls=document.createElement("div");controls.style.cssText="display:flex;gap:12px;flex-wrap:wrap;justify-content:center";
 const close=document.createElement("button");close.type="button";close.textContent="Close";
 const photo=document.createElement("button");photo.type="button";photo.textContent="Take photo instead";
 for(const btn of [close,photo])btn.style.cssText="border:1px solid #fff;border-radius:12px;padding:12px 18px;background:#fff;color:#222;font-size:16px";
 controls.append(close,photo);overlay.append(video,status,controls);document.body.append(overlay);
 let stream=null,running=true,busy=false,last=0,frame=0;
 const canvas=document.createElement("canvas");const ctx=canvas.getContext("2d",{willReadFrequently:true});
 const stop=()=>{
  running=false;cancelAnimationFrame(frame);
  if(stream)for(const track of stream.getTracks())track.stop();
  video.srcObject=null;overlay.remove();
 };
 close.onclick=stop;
 photo.onclick=()=>{stop();onPhoto();};
 try{
   const decoder=await load();
   if(!running)return;
   stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
   if(!running){for(const t of stream.getTracks())t.stop();return;}
   video.srcObject=stream;await video.play();
   const process=async(t)=>{
     if(!running)return;
     frame=requestAnimationFrame(process);
     if(busy||t-last<500||video.readyState<2)return;
     busy=true;last=t;
     try{
       const width=Math.min(1080,video.videoWidth||1080);
       const height=Math.round(width*(video.videoHeight||720)/(video.videoWidth||1280));
       canvas.width=width;canvas.height=height;
       ctx.drawImage(video,0,0,width,height);
       const result=await decoder.readBarcodes(ctx.getImageData(0,0,width,height),
         {tryHarder:true,formats:["EAN13","EAN8","UPCA","QRCode"],maxNumberOfSymbols:3});
       const code=result.map(normalize).find(Boolean);
       if(code&&running){stop();onDetected(code);}
     }catch(e){status.textContent="Scanning… Keep the barcode steady and well lit.";}
     finally{busy=false;}
   };
   frame=requestAnimationFrame(process);
 }catch(e){
  status.textContent="Camera unavailable. Take a photo instead.";
  console.warn("Live barcode scan",e);
 }
}
window.FancyBarcode={scan,openCamera};
})();