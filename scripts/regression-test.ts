import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runRegressionTestSuite() {
  console.log("=========================================");
  console.log(" SUNSHINE ERP AUTOMATED REGRESSION SUITE ");
  console.log("=========================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failedTests++;
    }
  }

  // 1. CREATE ADMIN
  const timestamp = Date.now();
  const adminRes = await fetch(`${BASE_URL}/api/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Regression Admin ${timestamp}`,
      email: `reg.admin.${timestamp}@sunshine.net`,
      phone: '9998887771',
      username: `regadmin${timestamp}`
    })
  });
  const adminData: any = await adminRes.json();
  assert(adminRes.status === 201 && adminData.status === 'success', 'Workflow 1: Create Admin', JSON.stringify(adminData));
  const adminUsername = adminData.username || `regadmin${timestamp}`;

  // 2. CREATE TEACHER
  const teacherRes = await fetch(`${BASE_URL}/api/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Regression Teacher ${timestamp}`,
      email: `reg.teacher.${timestamp}@sunshine.net`,
      phone: '9998887772',
      qualification: 'M.Sc Mathematics',
      specialty: ['Mathematics']
    })
  });
  const teacherData: any = await teacherRes.json();
  assert(teacherRes.status === 201 && teacherData.status === 'success', 'Workflow 2: Create Teacher', JSON.stringify(teacherData));
  const teacherUsername = teacherData.username;

  // 3. CREATE RECEPTIONIST
  const receptionRes = await fetch(`${BASE_URL}/api/receptionists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Regression Receptionist ${timestamp}`,
      email: `reg.rec.${timestamp}@sunshine.net`,
      phone: '9998887773'
    })
  });
  const receptionData: any = await receptionRes.json();
  assert(receptionRes.status === 201 && receptionData.status === 'success', 'Workflow 3: Create Receptionist', JSON.stringify(receptionData));
  const receptionUsername = receptionData.username;

  // 4. CREATE STUDENT
  const studentRes = await fetch(`${BASE_URL}/api/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Regression Student ${timestamp}`,
      className: 'Class 10th',
      mobile: '9998887774',
      fatherName: 'Father Student',
      email: `reg.student.${timestamp}@sunshine.net`,
      preferredBatch: '10th Morning CBSE'
    })
  });
  const studentData: any = await studentRes.json();
  assert((studentRes.status === 200 || studentRes.status === 201) && studentData.status === 'success', 'Workflow 4: Create Student', JSON.stringify(studentData));
  const studentUsername = studentData.user?.username || studentData.username;

  // 5. APPROVE ONLINE ENROLLMENT
  const enrollRes = await fetch(`${BASE_URL}/api/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: `Online Applicant ${timestamp}`,
      className: 'Class 11th',
      mobile: '9998887775',
      fatherName: 'Father Online',
      email: `online.${timestamp}@sunshine.net`
    })
  });
  const enrollData: any = await enrollRes.json();
  const admissionId = enrollData.admissionId;

  const approveRes = await fetch(`${BASE_URL}/api/admin/approve-enrollment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admissionId })
  });
  const approveData: any = await approveRes.json();
  assert(approveRes.status === 200 && approveData.status === 'success', 'Workflow 5: Approve Enrollment', JSON.stringify(approveData));

  // 6. LOGIN (ALL ROLES)
  const rolesToTest = [
    { name: 'ADMIN', user: adminUsername },
    { name: 'TEACHER', user: teacherUsername },
    { name: 'RECEPTIONIST', user: receptionUsername },
    { name: 'STUDENT', user: studentUsername }
  ];

  let adminJwtToken = '';

  for (const r of rolesToTest) {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: r.user, password: 'Sunshine123' })
    });
    const loginData: any = await loginRes.json();
    const success = loginRes.status === 200 && loginData.success === true && !!loginData.token;
    assert(success, `Workflow 6: Login (${r.name} - @${r.user})`, JSON.stringify(loginData));
    if (r.name === 'ADMIN') {
      adminJwtToken = loginData.token;
    }
  }

  // 7. FEE GENERATION
  const hasFees = Array.isArray(studentData.feeRecords) && studentData.feeRecords.length > 0;
  assert(hasFees, 'Workflow 7: Automatic Fee Schedule Generation', `Generated ${studentData.feeRecords?.length || 0} monthly records`);

  // 8. CHANGE PASSWORD
  const changePassRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      currentPassword: 'Sunshine123',
      newPassword: 'NewSecurePassword123!'
    })
  });
  const changePassData: any = await changePassRes.json();
  assert(changePassRes.status === 200 && changePassData.success === true, 'Workflow 8: Password Change via Authenticated Endpoint', JSON.stringify(changePassData));

  // 9. ROLE PERMISSIONS SECURITY
  const unauthRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: '123', newPassword: '456' })
  });
  assert(unauthRes.status === 401, 'Workflow 9: Role Security & JWT Authorization Enforcement');

  console.log("\n=========================================");
  console.log(` SUMMARY: ${passedTests} Passed | ${failedTests} Failed`);
  console.log("=========================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runRegressionTestSuite().catch(err => {
  console.error("Test suite execution error:", err);
  process.exit(1);
});
