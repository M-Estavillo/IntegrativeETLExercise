'use strict';
const inputs=['sisFile','lmsFile','accountingFile'].map(id=>document.getElementById(id));
const run=document.getElementById('runButton'), download=document.getElementById('download');
const output=document.getElementById('output'), status=document.getElementById('status'), warnings=document.getElementById('warnings');
let json='',revision=0;
function clear() { json=''; download.disabled=true; warnings.replaceChildren(); warnings.hidden=true; output.textContent='Upload the CSV files and click RUN ETL.'; status.dataset.error='false'; }
inputs.forEach(input=>input.addEventListener('change',()=>{ revision++; clear(); status.textContent='Files changed. Click RUN ETL to generate fresh output.'; }));
run.addEventListener('click',async()=>{
 clear();
 if(inputs.some(input=>!input.files.length)) { status.textContent='Please choose all three source CSV files.'; status.dataset.error='true'; return; }
 const current=revision;
 run.disabled=true;
 status.textContent='Reading and transforming CSV files…';
 try {
  const texts=await Promise.all(inputs.map(input=>input.files[0].text()));
  if(current!==revision) return;
  const result=ETL.runETL(...texts);
  json=JSON.stringify(result.students,null,2);
  output.textContent=json;
  for(const warning of result.warnings) { const li=document.createElement('li'); li.textContent=warning; warnings.append(li); }
  warnings.hidden=!result.warnings.length;
  status.textContent=`ETL complete: ${result.counts.sis} SIS, ${result.counts.lms} LMS, and ${result.counts.accounting} Accounting records extracted. ${result.students.length} students integrated; ${result.warnings.length} notices.`;
  download.disabled=false;
 } catch(error) { if(current!==revision) return; status.textContent=error.message; status.dataset.error='true'; output.textContent='ETL failed. Correct the source files and run again.'; }
 finally { run.disabled=false; }
});
download.addEventListener('click',()=>{
 if(!json) return;
 const url=URL.createObjectURL(new Blob([json+'\n'],{type:'application/json'}));
 const a=document.createElement('a'); a.href=url; a.download='integrated_students.json'; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
});
