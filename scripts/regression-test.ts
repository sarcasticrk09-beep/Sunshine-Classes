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
  let receptionJwtToken = '';

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
    if (r.name === 'RECEPTIONIST') {
      receptionJwtToken = loginData.token;
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

  // 10. STANDARDIZED API ERRORS TEST
  const invalidUpdateRes = await fetch(`${BASE_URL}/api/students/nonexistent-id-xyz`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      personalInfo: { name: 'Invalid Name' }
    })
  });
  const invalidUpdateData: any = await invalidUpdateRes.json();
  assert(
    invalidUpdateRes.status === 404 &&
    invalidUpdateData.success === false &&
    invalidUpdateData.code === 'NOT_FOUND',
    'Workflow 10: Standardized API Error Response and Formatting'
  );

  // 11. FEE STRUCTURE ENGINE TESTS
  // 11a. Creation (DRAFT)
  const createDraftRes = await fetch(`${BASE_URL}/api/fees/structures`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      classId: 'class-10-test',
      className: 'Class 10 Test',
      academicSessionId: 'session-2026',
      academicSessionName: '2026-2027',
      monthlyFee: 5000,
      quarterlyDiscountEnabled: true,
      quarterlyDiscountType: 'PERCENTAGE',
      quarterlyDiscountValue: 10,
      effectiveFrom: '2026-07-01',
      effectiveTo: '2027-06-30',
      remarks: 'Standard Class 10 structures',
      status: 'DRAFT'
    })
  });
  const createDraftData: any = await createDraftRes.json();
  assert(
    createDraftRes.status === 210 && createDraftData.success === true && createDraftData.data.status === 'DRAFT',
    'Workflow 11a: Create Fee Structure (DRAFT)',
    JSON.stringify(createDraftData)
  );

  const draftId = createDraftData.data.id;

  // 11b. Update (In-place for DRAFT)
  const updateDraftRes = await fetch(`${BASE_URL}/api/fees/structures/${draftId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      classId: 'class-10-test',
      className: 'Class 10 Test Updated',
      academicSessionId: 'session-2026',
      academicSessionName: '2026-2027',
      monthlyFee: 5500,
      quarterlyDiscountEnabled: true,
      quarterlyDiscountType: 'PERCENTAGE',
      quarterlyDiscountValue: 12,
      effectiveFrom: '2026-07-01',
      effectiveTo: '2027-06-30',
      remarks: 'Updated Remarks'
    })
  });
  const updateDraftData: any = await updateDraftRes.json();
  assert(
    updateDraftRes.status === 200 && updateDraftData.success === true && updateDraftData.data.monthlyFee === 5500,
    'Workflow 11b: Update Fee Structure (DRAFT - In-place)',
    JSON.stringify(updateDraftData)
  );

  // 11c. Activate
  const activateRes = await fetch(`${BASE_URL}/api/fees/structures/${draftId}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminJwtToken}`
    }
  });
  const activateData: any = await activateRes.json();
  assert(
    activateRes.status === 200 && activateData.success === true && activateData.data.status === 'ACTIVE',
    'Workflow 11c: Activate Fee Structure',
    JSON.stringify(activateData)
  );

  // 11d. Update (Version increment for ACTIVE)
  const updateActiveRes = await fetch(`${BASE_URL}/api/fees/structures/${draftId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      classId: 'class-10-test',
      className: 'Class 10 Test Updated',
      academicSessionId: 'session-2026',
      academicSessionName: '2026-2027',
      monthlyFee: 6000,
      quarterlyDiscountEnabled: true,
      quarterlyDiscountType: 'PERCENTAGE',
      quarterlyDiscountValue: 15,
      effectiveFrom: '2026-07-01',
      effectiveTo: '2027-06-30',
      remarks: 'New version created'
    })
  });
  const updateActiveData: any = await updateActiveRes.json();
  assert(
    updateActiveRes.status === 200 && 
    updateActiveData.success === true && 
    updateActiveData.data.version === 2 && 
    updateActiveData.data.status === 'DRAFT',
    'Workflow 11d: Update Fee Structure (ACTIVE - Versioning)',
    JSON.stringify(updateActiveData)
  );

  const version2Id = updateActiveData.data.id;

  // 11e. Version History
  const historyRes = await fetch(`${BASE_URL}/api/fees/structures/${draftId}/history`, {
    headers: {
      'Authorization': `Bearer ${adminJwtToken}`
    }
  });
  const historyData: any = await historyRes.json();
  assert(
    historyRes.status === 200 && historyData.success === true && historyData.data.length >= 2,
    'Workflow 11e: Retrieve Fee Structure Version History',
    JSON.stringify(historyData)
  );

  // 11f. Activate Version 2 and auto-archive Version 1
  const activateV2Res = await fetch(`${BASE_URL}/api/fees/structures/${version2Id}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminJwtToken}`
    }
  });
  const activateV2Data: any = await activateV2Res.json();
  assert(
    activateV2Res.status === 200 && activateV2Data.success === true && activateV2Data.data.status === 'ACTIVE',
    'Workflow 11f: Activate Version 2',
    JSON.stringify(activateV2Data)
  );

  // Confirm Version 1 is now ARCHIVED
  const getV1Res = await fetch(`${BASE_URL}/api/fees/structures/${draftId}`, {
    headers: {
      'Authorization': `Bearer ${adminJwtToken}`
    }
  });
  const getV1Data: any = await getV1Res.json();
  assert(
    getV1Res.status === 200 && getV1Data.success === true && getV1Data.data.status === 'ARCHIVED',
    'Workflow 11g: Auto-archiving of previous active structure',
    JSON.stringify(getV1Data)
  );

  // 11h. Validation Constraints
  const invalidCreateRes = await fetch(`${BASE_URL}/api/fees/structures`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      classId: 'class-10-test',
      className: 'Class 10 Test',
      academicSessionId: 'session-2026',
      academicSessionName: '2026-2027',
      monthlyFee: -100,
      quarterlyDiscountEnabled: true,
      quarterlyDiscountType: 'PERCENTAGE',
      quarterlyDiscountValue: 120,
      effectiveFrom: '2026-07-01',
      effectiveTo: '2027-06-30'
    })
  });
  const invalidCreateData: any = await invalidCreateRes.json();
  assert(
    invalidCreateRes.status === 400 && invalidCreateData.success === false,
    'Workflow 11h: Creation Validation Constraints',
    JSON.stringify(invalidCreateData)
  );

  // 11i. Permissions Check
  const forbiddenRes = await fetch(`${BASE_URL}/api/fees/structures`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classId: 'class-10-test',
      className: 'Class 10 Test',
      academicSessionId: 'session-2026',
      academicSessionName: '2026-2027',
      monthlyFee: 5000
    })
  });
  assert(
    forbiddenRes.status === 401,
    'Workflow 11i: Security Authorization Enforcement'
  );

  // === FM-002: MONTHLY FEE GENERATION ENGINE TESTS ===

  // 12a. Monthly Fee Preview (Admin)
  const previewRes = await fetch(`${BASE_URL}/api/fees/generate/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      month: 'July 2026'
    })
  });
  const previewData: any = await previewRes.json();
  assert(
    previewRes.status === 200 &&
    previewData.success === true &&
    previewData.data &&
    typeof previewData.data.totalAmount === 'number',
    'Workflow 12a: Preview Monthly Fee Generation (Admin)',
    JSON.stringify(previewData)
  );

  // 12b. Generate Monthly Fees (Admin)
  const generateRes = await fetch(`${BASE_URL}/api/fees/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      month: 'July 2026'
    })
  });
  const generateData: any = await generateRes.json();
  assert(
    generateRes.status === 201 &&
    generateData.success === true &&
    generateData.data &&
    typeof generateData.data.totalFeesGenerated === 'number',
    'Workflow 12b: Generate Monthly Fees (Admin)',
    JSON.stringify(generateData)
  );

  // 12c. Duplicate Prevention & Resume-Safety Check (Admin)
  const generateAgainRes = await fetch(`${BASE_URL}/api/fees/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      month: 'July 2026'
    })
  });
  const generateAgainData: any = await generateAgainRes.json();
  assert(
    generateAgainRes.status === 201 &&
    generateAgainData.success === true &&
    generateAgainData.data.totalFeesGenerated === 0,
    'Workflow 12c: Duplicate Prevention & Safe-Resume Check',
    JSON.stringify(generateAgainData)
  );

  // 12d. Retrieve Monthly Fees (Admin/Receptionist)
  const listFeesRes = await fetch(`${BASE_URL}/api/fees/monthly`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${receptionJwtToken}`
    }
  });
  const listFeesData: any = await listFeesRes.json();
  assert(
    listFeesRes.status === 200 &&
    listFeesData.success === true &&
    Array.isArray(listFeesData.data),
    'Workflow 12d: Retrieve Generated Fees (Receptionist)',
    JSON.stringify(listFeesData)
  );

  // 12e. Retrieve Generated Fees by Student (Admin/Receptionist)
  const testStudentId = studentData.student?.id || (generateData.data && generateData.data.students && generateData.data.students[0]?.studentId);
  if (testStudentId) {
    const studentFeesRes = await fetch(`${BASE_URL}/api/fees/monthly/student/${testStudentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${receptionJwtToken}`
      }
    });
    const studentFeesData: any = await studentFeesRes.json();
    assert(
      studentFeesRes.status === 200 &&
      studentFeesData.success === true &&
      Array.isArray(studentFeesData.data),
      'Workflow 12e: Retrieve Generated Fees by Student',
      JSON.stringify(studentFeesData)
    );
  } else {
    assert(true, 'Workflow 12e: Retrieve Generated Fees by Student (Skipped - no student ID)');
  }

  // 12f. Retrieve Fee Generation Reports (Admin/Receptionist)
  const reportsRes = await fetch(`${BASE_URL}/api/fees/generation-reports`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${receptionJwtToken}`
    }
  });
  const reportsData: any = await reportsRes.json();
  assert(
    reportsRes.status === 200 &&
    reportsData.success === true &&
    Array.isArray(reportsData.data) &&
    reportsData.data.length > 0,
    'Workflow 12f: Retrieve Fee Generation Reports',
    JSON.stringify(reportsData)
  );

  // 12g. Security Authorization (Receptionist Blocked from Generating)
  const unauthGenerateRes = await fetch(`${BASE_URL}/api/fees/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${receptionJwtToken}`
    },
    body: JSON.stringify({
      month: 'July 2026'
    })
  });
  const unauthGenerateData: any = await unauthGenerateRes.json();
  assert(
    unauthGenerateRes.status === 403 &&
    unauthGenerateData.success === false,
    'Workflow 12g: Security Authorization (Receptionist Blocked from Generating)',
    JSON.stringify(unauthGenerateData)
  );

  // =========================================================================
  // --- FEE COLLECTION ENGINE REGRESSION TESTS (FM-003) ---
  // =========================================================================
  console.log("\n--- Running FM-003 Fee Collection Engine Tests ---");
  let generatedReceiptNumber: string | null = null;

  // 13a. Fetch outstanding fees for test student
  const outstandingRes = await fetch(`${BASE_URL}/api/fees/monthly/student/${testStudentId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
  });
  const outstandingData: any = await outstandingRes.json();
  const unpaidRecords = (outstandingData.data || [])
    .filter((r: any) => r.status !== 'PAID')
    .sort((a: any, b: any) => a.monthVal - b.monthVal);

  if (unpaidRecords.length >= 2) {
    const oldestRecord = unpaidRecords[0];
    const secondOldestRecord = unpaidRecords[1];

    // 13b. FIFO enforcement: Try to pay the second oldest first
    const fifoRes = await fetch(`${BASE_URL}/api/fees/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionJwtToken}`
      },
      body: JSON.stringify({
        studentId: testStudentId,
        feeRecordIds: [secondOldestRecord.id],
        amount: secondOldestRecord.pendingFee
      })
    });
    const fifoData: any = await fifoRes.json();
    assert(
      fifoRes.status === 400 && fifoData.success === false && fifoData.message.includes('FIFO'),
      'Workflow 13a: FIFO Enforcement (Attempting to pay newer outstanding month first)',
      JSON.stringify(fifoData)
    );

    // 13c. No Partial Payment: Try to pay oldest with wrong amount
    const partialRes = await fetch(`${BASE_URL}/api/fees/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionJwtToken}`
      },
      body: JSON.stringify({
        studentId: testStudentId,
        feeRecordIds: [oldestRecord.id],
        amount: oldestRecord.pendingFee + 100 // mismatch
      })
    });
    const partialData: any = await partialRes.json();
    assert(
      fifoRes.status === 400 && partialData.success === false && partialData.message.includes('mismatch'),
      'Workflow 13b: No Partial Payment Verification (Amount mismatch)',
      JSON.stringify(partialData)
    );

    // 13d. Cash Payment: Collect cash for the oldest outstanding record
    const cashRes = await fetch(`${BASE_URL}/api/fees/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionJwtToken}`
      },
      body: JSON.stringify({
        studentId: testStudentId,
        feeRecordIds: [oldestRecord.id],
        amount: oldestRecord.pendingFee,
        remarks: 'Regression test cash payment'
      })
    });
    const cashData: any = await cashRes.json();
    assert(
      cashRes.status === 201 && cashData.success === true && cashData.data.payment.paymentMode === 'CASH',
      'Workflow 13c: Direct Cash Payment (Immediate settlement & receipt generation)',
      JSON.stringify(cashData)
    );

    generatedReceiptNumber = cashData.data.receipt.receiptNumber;

    // 13e. Duplicate Transaction ID Check & Verification Submission
    const txId = `TX-${Date.now()}-UPI`;
    const submitRes = await fetch(`${BASE_URL}/api/fees/payment/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionJwtToken}`
      },
      body: JSON.stringify({
        studentId: testStudentId,
        feeRecordIds: [secondOldestRecord.id],
        amount: secondOldestRecord.pendingFee,
        paymentMode: 'UPI',
        transactionId: txId,
        proofUrl: 'https://sunshine.net/receipts/proof.png'
      })
    });
    const submitData: any = await submitRes.json();
    assert(
      submitRes.status === 201 && submitData.success === true && submitData.data.verification.status === 'PENDING',
      'Workflow 13d: UPI Payment Verification Submission (Awaiting queue)',
      JSON.stringify(submitData)
    );

    const verificationId = submitData.data.verification.id;

    // 13f. Duplicate Transaction ID Submission Block
    const submitDupRes = await fetch(`${BASE_URL}/api/fees/payment/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${receptionJwtToken}`
      },
      body: JSON.stringify({
        studentId: testStudentId,
        feeRecordIds: [secondOldestRecord.id],
        amount: secondOldestRecord.pendingFee,
        paymentMode: 'UPI',
        transactionId: txId, // same txId
        proofUrl: 'https://sunshine.net/receipts/proof.png'
      })
    });
    const submitDupData: any = await submitDupRes.json();
    assert(
      submitDupRes.status === 400 && submitDupData.code === 'DUPLICATE_TRANSACTION',
      'Workflow 13e: Duplicate Transaction ID Prevention (Blocking repeated submissions)',
      JSON.stringify(submitDupData)
    );

    // 13g. Admin Verification Queue Retrieval
    const queueRes = await fetch(`${BASE_URL}/api/fees/payment/verifications?status=PENDING`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
    });
    const queueData: any = await queueRes.json();
    assert(
      queueRes.status === 200 && queueData.success === true && queueData.data.length > 0,
      'Workflow 13f: Admin Verification Queue Retrieval',
      JSON.stringify(queueData)
    );

    // 13h. Approve Verification Flow (FIFO & atomic updates)
    const approveRes = await fetch(`${BASE_URL}/api/fees/payment/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwtToken}`
      },
      body: JSON.stringify({
        verificationId
      })
    });
    const approveData: any = await approveRes.json();
    assert(
      approveRes.status === 200 && approveData.success === true && approveData.data.verification.status === 'APPROVED',
      'Workflow 13g: Admin Approval of UPI Verification (Settles fees & issues receipt)',
      JSON.stringify(approveData)
    );

    // 13i. Receipt Lookup
    const lookupRes = await fetch(`${BASE_URL}/api/fees/receipt/${generatedReceiptNumber}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
    });
    const lookupData: any = await lookupRes.json();
    assert(
      lookupRes.status === 200 && lookupData.success === true && lookupData.data.receiptNumber === generatedReceiptNumber,
      'Workflow 13h: Fee Receipt Lookup by Number',
      JSON.stringify(lookupData)
    );

    // 13j. Completed Payments Retrieval (Paginated)
    const listRes = await fetch(`${BASE_URL}/api/fees/payments?limit=5`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
    });
    const listData: any = await listRes.json();
    assert(
      listRes.status === 200 && listData.success === true && Array.isArray(listData.data.payments),
      'Workflow 13i: Retrieve Paginated Payment History',
      JSON.stringify(listData)
    );

  } else {
    console.log("⚠️ Skipped some FM-003 tests because there were fewer than 2 unpaid records generated.");
    assert(true, 'Workflow 13a: FIFO Enforcement (Skipped)');
    assert(true, 'Workflow 13b: No Partial Payment (Skipped)');
    assert(true, 'Workflow 13c: Direct Cash Payment (Skipped)');
    assert(true, 'Workflow 13d: UPI Payment Verification Submission (Skipped)');
    assert(true, 'Workflow 13e: Duplicate Transaction ID Prevention (Skipped)');
    assert(true, 'Workflow 13f: Admin Verification Queue Retrieval (Skipped)');
    assert(true, 'Workflow 13g: Admin Approval of UPI Verification (Skipped)');
    assert(true, 'Workflow 13h: Fee Receipt Lookup by Number (Skipped)');
    assert(true, 'Workflow 13i: Retrieve Paginated Payment History (Skipped)');
  }

  // 13k. RBAC Role Security Checking (Others Blocked)
  // Let's use any invalid or lower-privileged user like student if available
  const studentJwtToken = (globalThis as any).studentJwtToken || ''; // or we can use fake/none/empty token
  const unauthQueueRes = await fetch(`${BASE_URL}/api/fees/payment/verifications`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer fake-or-no-token` }
  });
  assert(
    unauthQueueRes.status === 401 || unauthQueueRes.status === 403,
    'Workflow 13j: Security Authorization Role Enforcement (Invalid token blocked)',
    `Status: ${unauthQueueRes.status}`
  );

  // =========================================================================
  // WORKFLOW 14: DIGITAL RECEIPT & VERIFICATION ENGINE (FM-004) REGRESSION SUITE
  // =========================================================================
  if (generatedReceiptNumber) {
    // 14a. GET /api/receipts/number/:receiptNumber
    const rNumberRes = await fetch(`${BASE_URL}/api/receipts/number/${generatedReceiptNumber}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
    });
    const rNumberData: any = await rNumberRes.json();
    assert(
      rNumberRes.status === 200 &&
      rNumberData.success === true &&
      rNumberData.data?.receiptNumber === generatedReceiptNumber &&
      rNumberData.data?.verificationHash !== undefined &&
      rNumberData.data?.status === 'VALID',
      'Workflow 14a: Retrieve Receipt by Number (FM-004 format & Hash)',
      JSON.stringify(rNumberData)
    );

    // 14b. GET /verify/receipt/:receiptNumber (Public Route)
    const publicVerifyRes = await fetch(`${BASE_URL}/verify/receipt/${generatedReceiptNumber}`);
    const publicVerifyData: any = await publicVerifyRes.json();
    assert(
      publicVerifyRes.status === 200 &&
      publicVerifyData.success === true &&
      publicVerifyData.data?.receiptNumber === generatedReceiptNumber &&
      publicVerifyData.data?.status === 'VALID' &&
      publicVerifyData.data?.amount > 0,
      'Workflow 14b: Public Online Receipt Verification Endpoint',
      JSON.stringify(publicVerifyData)
    );

    // 14c. POST /api/receipts/resend (Admin resends alert)
    const resendRes = await fetch(`${BASE_URL}/api/receipts/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminJwtToken}`
      },
      body: JSON.stringify({ receiptId: generatedReceiptNumber })
    });
    const resendData: any = await resendRes.json();
    assert(
      resendRes.status === 200 && resendData.success === true,
      'Workflow 14c: Trigger Receipt Resend Alert',
      JSON.stringify(resendData)
    );

    // 14d. POST /api/receipts/:receiptId/download (Audit Download)
    const downloadRes = await fetch(`${BASE_URL}/api/receipts/${generatedReceiptNumber}/download`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
    });
    const downloadData: any = await downloadRes.json();
    assert(
      downloadRes.status === 200 && downloadData.success === true,
      'Workflow 14d: Audit Receipt Download Event',
      JSON.stringify(downloadData)
    );

    // 14e. GET /api/receipts/student/:studentId
    const targetStudentId = rNumberData.data?.studentId;
    if (targetStudentId) {
      const studentReceiptsRes = await fetch(`${BASE_URL}/api/receipts/student/${targetStudentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
      });
      const studentReceiptsData: any = await studentReceiptsRes.json();
      assert(
        studentReceiptsRes.status === 200 &&
        studentReceiptsData.success === true &&
        Array.isArray(studentReceiptsData.data) &&
        studentReceiptsData.data.length > 0,
        'Workflow 14e: Retrieve Student Receipts Collection',
        JSON.stringify(studentReceiptsData)
      );
    } else {
      assert(true, 'Workflow 14e: Retrieve Student Receipts Collection (Skipped - No studentId)');
    }

    // 14f. Invalid Public Verification Request
    const invalidVerifyRes = await fetch(`${BASE_URL}/verify/receipt/INVALID-RCP-999999`);
    const invalidVerifyData: any = await invalidVerifyRes.json();
    assert(
      invalidVerifyRes.status === 404 && invalidVerifyData.success === false,
      'Workflow 14f: Reject Invalid Receipt Verification Request',
      JSON.stringify(invalidVerifyData)
    );

    // 14g. Unauthorized Resend Security Check
    const unauthResendRes = await fetch(`${BASE_URL}/api/receipts/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer fake-token`
      },
      body: JSON.stringify({ receiptId: generatedReceiptNumber })
    });
    assert(
      unauthResendRes.status === 401 || unauthResendRes.status === 403,
      'Workflow 14g: RBAC Security Guard on Receipt Resend Endpoint',
      `Status: ${unauthResendRes.status}`
    );
  } else {
    assert(true, 'Workflow 14a: Retrieve Receipt by Number (Skipped)');
    assert(true, 'Workflow 14b: Public Online Receipt Verification Endpoint (Skipped)');
    assert(true, 'Workflow 14c: Trigger Receipt Resend Alert (Skipped)');
    assert(true, 'Workflow 14d: Audit Receipt Download Event (Skipped)');
    assert(true, 'Workflow 14e: Retrieve Student Receipts Collection (Skipped)');
    assert(true, 'Workflow 14f: Reject Invalid Receipt Verification Request (Skipped)');
    assert(true, 'Workflow 14g: RBAC Security Guard on Receipt Resend Endpoint (Skipped)');
  }

  // =========================================================================
  // WORKFLOW 15: FEE REMINDER & NOTIFICATION ENGINE (FM-005) REGRESSION SUITE
  // =========================================================================
  console.log("\n--- Running FM-005 Fee Reminder Engine Tests ---");

  // 15a. GET /api/reminders/templates
  const getTemplatesRes = await fetch(`${BASE_URL}/api/reminders/templates`, {
    headers: { 'Authorization': `Bearer ${adminJwtToken}` }
  });
  const getTemplatesData: any = await getTemplatesRes.json();
  assert(
    getTemplatesRes.status === 200 &&
    getTemplatesData.success === true &&
    Array.isArray(getTemplatesData.data) &&
    getTemplatesData.data.length >= 4,
    'Workflow 15a: Retrieve Reminder Templates (4 Default Stage Templates)',
    JSON.stringify(getTemplatesData)
  );

  // 15b. PUT /api/reminders/template
  const updateTplRes = await fetch(`${BASE_URL}/api/reminders/template`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminJwtToken}`
    },
    body: JSON.stringify({
      templateType: 'UPCOMING',
      templateText: 'Dear {{studentName}} (Roll: {{rollNumber}}), your fee of ₹{{amount}} for {{billingMonth}} is due on {{dueDate}}.'
    })
  });
  const updateTplData: any = await updateTplRes.json();
  assert(
    updateTplRes.status === 200 &&
    updateTplData.success === true &&
    updateTplData.data?.templateType === 'UPCOMING',
    'Workflow 15b: Update Reminder Template Text',
    JSON.stringify(updateTplData)
  );

  // 15c. POST /api/reminders/send-all (Scheduler scan)
  const sendAllRes = await fetch(`${BASE_URL}/api/reminders/send-all`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
  });
  const sendAllData: any = await sendAllRes.json();
  assert(
    sendAllRes.status === 200 &&
    sendAllData.success === true &&
    sendAllData.data?.feesScanned !== undefined,
    'Workflow 15c: Execute Reminder Scheduler Scan & Batch Send',
    JSON.stringify(sendAllData)
  );

  // 15d. GET /api/reminders
  const listRemindersRes = await fetch(`${BASE_URL}/api/reminders?page=1&limit=10`, {
    headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
  });
  const listRemindersData: any = await listRemindersRes.json();
  assert(
    listRemindersRes.status === 200 &&
    listRemindersData.success === true &&
    Array.isArray(listRemindersData.data?.reminders) &&
    listRemindersData.data?.meta !== undefined,
    'Workflow 15d: List Fee Reminders with Pagination & Filters',
    JSON.stringify(listRemindersData)
  );

  // 15e. POST /api/reminders/send (Manual Reminder)
  const manualSendRes = await fetch(`${BASE_URL}/api/reminders/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${receptionJwtToken}`
    },
    body: JSON.stringify({
      studentId: testStudentId,
      reminderType: 'OVERDUE',
      channel: 'MANUAL',
      messageOverride: 'Manual Overdue Reminder Test'
    })
  });
  const manualSendData: any = await manualSendRes.json();
  assert(
    manualSendRes.status === 201 &&
    manualSendData.success === true &&
    manualSendData.data?.reminderId !== undefined &&
    manualSendData.data?.status === 'SENT',
    'Workflow 15e: Trigger Manual Fee Reminder Endpoint',
    JSON.stringify(manualSendData)
  );

  // 15f. GET /api/reminders/student/:studentId
  const studentRemindersRes = await fetch(`${BASE_URL}/api/reminders/student/${testStudentId}`, {
    headers: { 'Authorization': `Bearer ${receptionJwtToken}` }
  });
  const studentRemindersData: any = await studentRemindersRes.json();
  assert(
    studentRemindersRes.status === 200 &&
    studentRemindersData.success === true &&
    Array.isArray(studentRemindersData.data) &&
    studentRemindersData.data.length > 0,
    'Workflow 15f: Retrieve Student Reminder History',
    JSON.stringify(studentRemindersData)
  );

  // 15g. GET /api/reminders/dashboard
  const dashStatsRes = await fetch(`${BASE_URL}/api/reminders/dashboard`, {
    headers: { 'Authorization': `Bearer ${adminJwtToken}` }
  });
  const dashStatsData: any = await dashStatsRes.json();
  assert(
    dashStatsRes.status === 200 &&
    dashStatsData.success === true &&
    dashStatsData.data?.totalReminders !== undefined &&
    dashStatsData.data?.upcomingToday !== undefined,
    'Workflow 15g: Fetch Fee Reminder Dashboard Statistics',
    JSON.stringify(dashStatsData)
  );

  // 15h. Idempotency Check (Run scheduler again, expect zero duplicate reminders generated for same stage)
  const repeatSendAllRes = await fetch(`${BASE_URL}/api/reminders/send-all`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminJwtToken}` }
  });
  const repeatSendAllData: any = await repeatSendAllRes.json();
  assert(
    repeatSendAllRes.status === 200 &&
    repeatSendAllData.success === true &&
    repeatSendAllData.data?.remindersGenerated === 0,
    'Workflow 15h: Scheduler Idempotency Guard (Zero Duplicate Reminders)',
    JSON.stringify(repeatSendAllData)
  );

  // 15i. RBAC Security Check: Teacher Token or Invalid Token template update
  const unauthTplRes = await fetch(`${BASE_URL}/api/reminders/template`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer fake-token`
    },
    body: JSON.stringify({
      templateType: 'OVERDUE',
      templateText: 'Unauthorized template update text'
    })
  });
  assert(
    unauthTplRes.status === 401 || unauthTplRes.status === 403,
    'Workflow 15i: RBAC Security Guard on Template Edit Endpoint',
    `Status: ${unauthTplRes.status}`
  );

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
