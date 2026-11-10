# Source-to-target data mapping

| Source | Field | Target | Type | Rule |
|---|---|---|---|---|
| SIS | student_id | studentId | Integer | Trim; convert to integer; join key. |
| SIS | student_name | studentName | String | Trim; collapse spaces; proper case. |
| SIS | program_code | program | String | Trim; uppercase; map BSIT, BSCS, BSIS to full names. |
| SIS | email | emailAddress | String | Trim; lowercase. |
| LMS | student_id | studentId (join key) | Integer | Trim; convert to integer; match SIS. |
| LMS | course_code | courses[].courseCode | String | Trim; uppercase. |
| LMS | final_grade | courses[].finalGrade | Number / String / null | Numeric text to number; retain uppercase text such as INC; blank to null. |
| LMS | completion_status | courses[].completionStatus | String | Trim; normalize to proper case. |
| Accounting | student_id | studentId (join key) | Integer | Trim; convert to integer; match SIS. |
| Accounting | account_balance | accounting.outstandingBalance | Number / null | Trim; convert to decimal number; blank to null. |
| Accounting | currency | accounting.currency | String | Trim; uppercase. |
