(function(root) {
'use strict';
const {parseCSV} = typeof module !== 'undefined' && module.exports ? require('./csv-parser.js') : root.CSVParser;
const programs = {BSIT:'Bachelor of Science in Information Technology',BSCS:'Bachelor of Science in Computer Science',BSIS:'Bachelor of Science in Information Systems'};
const mapping = [
 ['SIS','student_id','studentId','Integer','Trim; convert to integer; join key.'],
 ['SIS','student_name','studentName','String','Trim; collapse spaces; proper case.'],
 ['SIS','program_code','program','String','Trim; uppercase; map BSIT, BSCS, BSIS to full names.'],
 ['SIS','email','emailAddress','String','Trim; lowercase.'],
 ['LMS','student_id','studentId (join key)','Integer','Trim; convert to integer; match SIS.'],
 ['LMS','course_code','courses[].courseCode','String','Trim; uppercase.'],
 ['LMS','final_grade','courses[].finalGrade','Number / String / null','Numeric text to number; retain uppercase text such as INC; blank to null.'],
 ['LMS','completion_status','courses[].completionStatus','String','Trim; normalize to proper case.'],
 ['Accounting','student_id','studentId (join key)','Integer','Trim; convert to integer; match SIS.'],
 ['Accounting','account_balance','accounting.outstandingBalance','Number / null','Trim; convert to decimal number; blank to null.'],
 ['Accounting','currency','accounting.currency','String','Trim; uppercase.']
];
const proper = text => text.trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|[\s\-'’])\p{L}/gu, s=>s.toUpperCase());
function id(value, context) {
 if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(context + ': invalid student_id.');
 return Number(value);
}
function decimal(value, context) {
 if (value === '') return null;
 if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value))) throw new Error(context + ': invalid decimal number.');
 return Number(value);
}
function extract(text, source, required) {
 const rows = parseCSV(text);
 if (!rows.length) throw new Error(source + ': empty CSV file.');
 const headers = rows.shift().map(s=>s.trim());
 if (new Set(headers).size !== headers.length) throw new Error(source + ': duplicate headers.');
 const missing = required.filter(h=>!headers.includes(h));
 if (missing.length) throw new Error(source + ': missing columns ' + missing.join(', ') + '.');
 return rows.map((row,i)=>{
  const context = source + ' record ' + (i+1);
  if (row.length !== headers.length) throw new Error(context + ': incorrect column count.');
  const record = Object.fromEntries(headers.map((h,j)=>[h,row[j].trim()]));
  record.student_id = id(record.student_id,context);
  return record;
 });
}
function runETL(sisText,lmsText,accountingText) {
 const sis=extract(sisText,'SIS',['student_id','student_name','program_code','email']);
 const lms=extract(lmsText,'LMS',['student_id','course_code','final_grade','completion_status']);
 const accounting=extract(accountingText,'Accounting',['student_id','account_balance','currency']);
 if (!sis.length) throw new Error('SIS must contain at least one student.');
 const students=new Map(), warnings=[];
 for (const row of sis) {
  const studentId=row.student_id, code=row.program_code.toUpperCase();
  if(students.has(studentId)) throw new Error('Duplicate SIS student_id: '+studentId);
  if(!row.student_name) throw new Error('SIS student '+studentId+': student_name is required.');
  if(!Object.hasOwn(programs,code)) warnings.push('Student '+studentId+': unknown program code '+(code || '(blank)')+' retained.');
  students.set(studentId,{studentId,studentName:proper(row.student_name),program:programs[code] || code,emailAddress:row.email.toLowerCase(),courses:[],accounting:null});
 }
 const pairs=new Set(), accounts=new Set();
 for(const row of lms) {
  const courseCode=row.course_code.toUpperCase();
  if(!courseCode) throw new Error('LMS student '+row.student_id+': course_code is required.');
  const key=JSON.stringify([row.student_id,courseCode]);
  if(pairs.has(key)) throw new Error('Duplicate LMS student/course: '+row.student_id+' / '+courseCode);
  pairs.add(key);
  const grade=row.final_grade;
  const finalGrade=grade===''?null:/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(grade)?decimal(grade,'LMS grade'):grade.toUpperCase();
  const student=students.get(row.student_id);
  if(!student) { warnings.push('LMS student '+row.student_id+' has no SIS record; excluded.'); continue; }
  student.courses.push({courseCode,finalGrade,completionStatus:proper(row.completion_status)});
 }
 for(const row of accounting) {
  if(accounts.has(row.student_id)) throw new Error('Duplicate Accounting student_id: '+row.student_id);
  accounts.add(row.student_id);
  const account={outstandingBalance:decimal(row.account_balance,'Accounting student '+row.student_id),currency:row.currency.toUpperCase()};
  const student=students.get(row.student_id);
  if(!student) { warnings.push('Accounting student '+row.student_id+' has no SIS record; excluded.'); continue; }
  student.accounting=account;
 }
 for(const student of students.values()) {
  if(!student.courses.length) warnings.push('Student '+student.studentId+': missing LMS data; courses is [].');
  if(student.accounting===null) warnings.push('Student '+student.studentId+': missing Accounting data; accounting is null.');
 }
 return {students:[...students.values()],warnings,counts:{sis:sis.length,lms:lms.length,accounting:accounting.length}};
}
const api={runETL,mapping};
if(typeof module !== 'undefined' && module.exports) module.exports=api; else root.ETL=api;
})(globalThis);
