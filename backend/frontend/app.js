console.log("✅ main.js loaded");

// ✅ Apply saved theme on load
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}


// ✅ Inject user name dynamically
const userName = localStorage.getItem("userName") || "User";
const userNameSpan = document.getElementById("userName");
const userNameHero = document.getElementById("userNameHero");
if (userNameSpan) userNameSpan.textContent = userName;
if (userNameHero) userNameHero.textContent = userName;

// 🔐 Login Form Handling
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const role = document.getElementById("loginRole").value; // 'admin', 'teacher', or 'student'
    const email = document.getElementById("loginEmail").value.toLowerCase().trim();
    const password = document.getElementById("loginPassword").value;

    const data = { email, password };
    const endpoint = `/api/${role}/login`;

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        // parse JSON if possible, otherwise get text
        let body;
        try {
          body = await res.json();
        } catch (e) {
          try { body = { error: await res.text() }; } catch (e2) { body = { error: 'Unknown response' }; }
        }
        console.log('✅ Login HTTP:', res.status, body);

        if (!res.ok) {
          const msg = body && body.error ? body.error : res.statusText || 'Login failed';
          alert('Login failed: ' + msg);
          return;
        }

        if (!body || !body.success) {
          alert('Login failed: ' + (body && body.error ? body.error : 'Invalid credentials'));
          return;
        }

        // Try to locate the user object in a few common response shapes
        let user = null;
        if (body && typeof body === 'object') {
          if (body[role]) user = body[role];
          else if (body.user) user = body.user;
          else if (body.data) user = body.data;
          else {
            // scan for the first object-like property that looks like a user
            for (const k of Object.keys(body)) {
              const val = body[k];
              if (val && typeof val === 'object') {
                if (val.email || val.name || val.id || val.user_id || val[`${role}_id`]) {
                  user = val;
                  break;
                }
              }
            }

            // Contact form submission handler (index.html)
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
              contactForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const firstName = (document.getElementById('firstName') || {}).value || '';
                const lastName = (document.getElementById('lastName') || {}).value || '';
                const email = (document.getElementById('email') || {}).value || '';
                const message = (document.getElementById('message') || {}).value || '';

                if (!firstName || !email || !message) {
                  alert('Please provide your name, email and a message.');
                  return;
                }

                const payload = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), message: message.trim() };
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
                  .then(async res => {
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(body && body.error ? body.error : 'Failed to submit');
                    alert('Thank you — your message has been received.');
                    contactForm.reset();
                  })
                  .catch(err => {
                    console.error('Contact submit error:', err);
                    alert('Failed to send message: ' + (err && err.message ? err.message : 'Network error'));
                  })
                  .finally(() => { if (submitBtn) submitBtn.disabled = false; });
              });
            }
          }
        }

        if (!user) {
          alert('Login failed: server did not return user data.');
          console.error('Missing user object in login response:', body);
          return;
        }

        // Robustly extract a user id from common key names
        const possibleIdKeys = [`${role}_id`, 'id', 'user_id', `${role}Id`, `${role}ID`, `${role}_ID`];
        let userId = null;
        for (const k of possibleIdKeys) {
          if (user[k] !== undefined && user[k] !== null) {
            userId = user[k];
            break;
          }
        }
        // fallback: look for any numeric value in the user object
        if (userId == null) {
          for (const v of Object.values(user)) {
            if (typeof v === 'number') {
              userId = v;
              break;
            }
          }
        }

        // Save user info (use safe fallbacks)
        try {
          localStorage.setItem(
            'userName',
            user.name || user.full_name || user.email || (role === 'admin' ? 'Admin' : 'User')
          );
          if (userId != null) localStorage.setItem('userId', String(userId));
          else localStorage.removeItem('userId');
          localStorage.setItem('userEmail', user.email || '');
          localStorage.setItem('userRole', role);
          // Keep backward-compatible teacher keys too (some pages use teacherId/teacherName)
          if (role === 'teacher' && userId != null) {
            localStorage.setItem('teacherId', String(userId));
            localStorage.setItem('teacherName', user.name || user.full_name || user.email || 'Teacher');
          }
        } catch (e) {
          console.warn('Could not persist user info to localStorage', e);
        }

        console.log('User logged in:', { role, userId, user });

        // Redirect based on role to the actual frontend pages present in the repo.
        if (role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (role === "teacher") {
          window.location.href = "teacher-dashboard.html";
        } else {
          // student
          window.location.href = "student-landing.html";
        }
      })
      .catch((error) => {
        console.error("❌ Login error:", error);
        alert('Login failed: ' + (error && error.message ? error.message : 'Network error'));
      })
      .finally(() => {
        try { loginForm.reset(); } catch (e) { }
      });
  });
}

// 📝 Signup Form Handling (Student self-signup or Admin adds teacher/student)
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Check if this is student self-signup (no role selector) or admin signup
    const roleSelector = document.getElementById("signupRole");
    const isStudentSelfSignup = !roleSelector;

    if (isStudentSelfSignup) {
      // Student self-signup flow
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.toLowerCase().trim();
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Validate password match
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      // Validate password length
      if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
      }

      const data = { name, email, password };
      const endpoint = `/api/student/signup`;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((response) => {
          console.log("✅ Signup response:", response);
          if (response.success) {
            alert("Account created successfully! Please login.");
            window.location.href = "login.html";
          } else {
            alert("Signup failed: " + (response.error || "Unknown error"));
          }
        })
        .catch((error) => {
          console.error("❌ Signup error:", error);
          alert("Signup failed: " + (error.message || "Network error"));
        })
        .finally(() => {
          try { signupForm.reset(); } catch (e) { }
        });
    } else {
      // Admin adding teacher/student flow
      const role = roleSelector.value;
      const name = document.getElementById("signupName").value;
      const email = document.getElementById("signupEmail").value.toLowerCase().trim();
      const password = document.getElementById("signupPassword").value;

      const data = { name, email, password };
      const endpoint = `/api/admin/add-${role}`;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((response) => {
          console.log("✅ Signup response:", response);
          if (response.success) {
            alert(`${role.charAt(0).toUpperCase() + role.slice(1)} added successfully`);
            window.location.href = "login.html";
          } else {
            alert("Signup failed: " + response.error);
          }
          signupForm.reset();
        })
        .catch((error) => {
          console.error("❌ Signup error:", error);
          alert("Signup failed.");
        });
    }
  });
}

