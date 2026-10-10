const dotenv = require("dotenv");
dotenv.config();

const API_BASE = "http://localhost:5000";

async function runAudit() {
  console.log("==========================================");
  console.log("KURAL AI - PHASE 1 AUDIT & VERIFICATION");
  console.log("==========================================\n");

  let cookie = "";

  // 1. GET /api/health
  console.log("1. Testing GET /api/health...");
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    console.log("   Status Code:", res.status);
    console.log("   Health Response:", JSON.stringify(data));
    if (res.status === 200 && data.dbStatus === "connected") {
      console.log("   ✅ Health check PASSED! MongoDB is connected.\n");
    } else {
      console.error("   ❌ Health check FAILED:", data);
    }
  } catch (err) {
    console.error("   ❌ Health check connection failed:", err.message);
    return;
  }

  // Generate unique test email timestamp
  const testId = Date.now();
  const testEmail = `audit_user_${testId}@kuralai.test`;
  const testPass = "SecurePass123!";
  const testName = `Audit Tester ${testId}`;

  // 2. Signup Test
  console.log(`2. Testing POST /api/auth/signup for ${testEmail}...`);
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: testName,
        email: testEmail,
        password: testPass,
        preferredLanguage: "ta",
        phone: "+919876543210",
      }),
    });

    const setCookieHeader = res.headers.get("set-cookie");
    if (setCookieHeader) {
      cookie = setCookieHeader.split(";")[0];
    }

    const data = await res.json();
    console.log("   Status Code:", res.status);
    console.log("   User returned:", data.user ? { id: data.user.id, email: data.user.email, name: data.user.displayName } : data);

    if (res.status === 201 && data.user && data.user.email === testEmail) {
      console.log("   ✅ Signup test PASSED! User persisted in MongoDB.\n");
    } else {
      console.error("   ❌ Signup test FAILED:", data);
    }
  } catch (err) {
    console.error("   ❌ Signup request error:", err.message);
  }

  // 3. Duplicate Email Rejection
  console.log(`3. Testing duplicate email rejection for ${testEmail}...`);
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Duplicate Person",
        email: testEmail,
        password: "AnotherPassword123",
      }),
    });
    const data = await res.json();
    console.log("   Status Code:", res.status);
    console.log("   Response Message:", data.message);
    if (res.status === 400 && data.message?.toLowerCase().includes("exist")) {
      console.log("   ✅ Duplicate email rejection PASSED!\n");
    } else {
      console.error("   ❌ Duplicate email test FAILED:", data);
    }
  } catch (err) {
    console.error("   ❌ Duplicate test error:", err.message);
  }

  // 4. Logout Test
  console.log("4. Testing POST /api/auth/logout...");
  try {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    console.log("   Status Code:", res.status);
    if (res.status === 200) {
      console.log("   ✅ Logout test PASSED!\n");
    }
  } catch (err) {
    console.error("   ❌ Logout test error:", err.message);
  }

  // 5. Unauthenticated Private Route Protection
  console.log("5. Testing GET /api/auth/me without cookie (Unauthenticated)...");
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`);
    console.log("   Status Code:", res.status);
    if (res.status === 401) {
      console.log("   ✅ Unauthenticated route protection PASSED!\n");
    } else {
      console.error("   ❌ Route protection FAILED!");
    }
  } catch (err) {
    console.error("   ❌ Route protection error:", err.message);
  }

  // 6. Login Success Test
  console.log(`6. Testing POST /api/auth/login for ${testEmail}...`);
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPass,
      }),
    });

    const setCookieHeader = res.headers.get("set-cookie");
    if (setCookieHeader) {
      cookie = setCookieHeader.split(";")[0];
    }

    const data = await res.json();
    console.log("   Status Code:", res.status);
    if (res.status === 200 && data.user) {
      console.log("   ✅ Login test PASSED!\n");
    } else {
      console.error("   ❌ Login test FAILED:", data);
    }
  } catch (err) {
    console.error("   ❌ Login test error:", err.message);
  }

  // 7. GET /api/auth/me with Valid Session Cookie
  console.log("7. Testing GET /api/auth/me with session cookie...");
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    const data = await res.json();
    console.log("   Status Code:", res.status);
    console.log("   User session profile:", data.user ? { email: data.user.email, name: data.user.displayName } : data);
    if (res.status === 200 && data.user && data.user.email === testEmail) {
      console.log("   ✅ Authenticated /api/auth/me PASSED!\n");
    } else {
      console.error("   ❌ /api/auth/me FAILED:", data);
    }
  } catch (err) {
    console.error("   ❌ Auth me error:", err.message);
  }

  // 8. Incorrect Password Rejection
  console.log("8. Testing POST /api/auth/login with wrong password...");
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword999",
      }),
    });
    const data = await res.json();
    console.log("   Status Code:", res.status);
    console.log("   Error Message:", data.message);
    if (res.status === 401 || res.status === 400) {
      console.log("   ✅ Incorrect password rejection PASSED!\n");
    } else {
      console.error("   ❌ Incorrect password test FAILED:", data);
    }
  } catch (err) {
    console.error("   ❌ Wrong password error:", err.message);
  }

  console.log("==========================================");
  console.log("ALL PHASE 1 PERSISTENCE TESTS COMPLETE!");
  console.log("==========================================");
}

runAudit();
