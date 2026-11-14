export function hasExpectedFileContent(mime: string, bytes: Uint8Array): boolean {
  const type=mime.split(";")[0].trim().toLowerCase();
  if(type==="application/pdf")return starts(bytes,[0x25,0x50,0x44,0x46,0x2d]);
  if(type==="image/jpeg")return starts(bytes,[0xff,0xd8,0xff]);
  if(type==="image/png")return starts(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if(type==="image/webp")return bytes.length>=12&&ascii(bytes,0,4)==="RIFF"&&ascii(bytes,8,4)==="WEBP";
  if(type==="text/plain"||type==="text/csv"||type==="application/json"){
    if(bytes.includes(0))return false;
    try{const decoded=new TextDecoder("utf-8",{fatal:true}).decode(bytes);if(type==="application/json"){JSON.parse(decoded);return true;}return decoded.trim().length>0;}catch{return false;}
  }
  return false;
}
function starts(bytes:Uint8Array,signature:number[]){return signature.every((value,index)=>bytes[index]===value);}
function ascii(bytes:Uint8Array,start:number,length:number){return Array.from(bytes.slice(start,start+length)).map(value=>String.fromCharCode(value)).join("");}
