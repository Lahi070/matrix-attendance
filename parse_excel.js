/* eslint-disable */
const xlsx = require('xlsx');
const fs = require('fs');

try {
  const workbook = xlsx.readFile('Book6.xlsx');
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  
  let sql = '-- Seed data generated from Book6.xlsx\n\n';
  
  // 1. Extract unique modules
  const moduleNames = [...new Set(data.map(r => r['New Module']).filter(Boolean))];
  
  // Generate SQL for modules
  const moduleMap = {}; // name -> uuid (we will generate uuids for them to link)
  const crypto = require('crypto');
  
  sql += '/* --------- MODULES --------- */\n';
  moduleNames.forEach(mod => {
    const id = crypto.randomUUID();
    const modStr = String(mod);
    moduleMap[mod] = id;
    sql += `INSERT INTO modules (id, name, is_active) VALUES ('${id}', '${modStr.replace(/'/g, "''")}', true);\n`;
  });
  
  // 2. Generate SQL for team members
  sql += '\n/* --------- TEAM MEMBERS --------- */\n';
  
  const mapRole = (designation) => {
    if (!designation) return 'Team Member';
    const d = designation.toLowerCase();
    if (d.includes('gl')) return 'Group Leader';
    if (d.includes('team leader')) return 'Team Leader';
    if (d.includes('mender')) return 'Mender';
    if (d.includes('indirect')) return 'Indirect';
    return 'Team Member';
  };
  
  const mapGender = (gender) => {
    if (gender === 'Male' || gender === 'Female') return gender;
    return 'Female'; // default fallback
  };

  data.forEach(row => {
    if (!row.EPF || !row.Name || !row['New Module']) return;
    
    const epf = String(row.EPF).replace(/'/g, "''");
    const name = String(row.Name).replace(/'/g, "''");
    const gender = mapGender(row.Gender);
    const role = mapRole(row.Designation);
    const moduleId = moduleMap[row['New Module']];
    
    if (moduleId) {
      sql += `INSERT INTO team_members (name, epf, gender, role, module_id) VALUES ('${name}', '${epf}', '${gender}', '${role}', '${moduleId}');\n`;
    }
  });

  fs.writeFileSync('supabase/seed.sql', sql);
  console.log("SUCCESS: supabase/seed.sql created with", data.length, "records.");
  
} catch (err) {
  console.error("Error:", err);
}

