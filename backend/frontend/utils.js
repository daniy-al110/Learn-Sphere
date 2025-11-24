// Initialize Lucide icons
lucide.createIcons();

// Global variables
let currentUser = localStorage.getItem("userName") || "Student";
let currentUserId = localStorage.getItem("userId");
let currentUserEmail = localStorage.getItem("userEmail") || "";
let currentRole = localStorage.getItem("userRole") || "";
let enrolledCourseIds = [];

// Redirect if not logged in as student
if (!currentUserId || currentRole !== 'student') {
  window.location.href = 'login.html';
}

// Download transcript as PDF using html2canvas + jsPDF
async function downloadTranscriptPDF() {
  const btn = document.getElementById('downloadTranscriptBtn');
  if (btn) btn.disabled = true;
  try {
    const container = document.getElementById('transcriptContainer');
    if (!container) throw new Error('Transcript container not found');
    // render
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const studentId = localStorage.getItem('userId') || 'student';
    pdf.save(`transcript_${studentId}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    alert('Failed to generate PDF. Check console for details.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  initializeApp();
  setupEventListeners();
  addInteractiveEffects();
  loadEnrolledCourses();
  lucide.createIcons();

  // Load and show the logged-in student's CGPA in the sidebar
  if (typeof loadStudentCgpa === 'function') loadStudentCgpa();

  // Load initial page data
  const currentPage = window.location.hash.slice(1) || 'dashboard';
  showPage(currentPage);
});

function initializeApp() {
  const userNameEl = document.getElementById("userName");
  const heroUserNameEl = document.getElementById("heroUserName");
  const userInitialEl = document.getElementById("userInitial");
  if (userNameEl) userNameEl.textContent = currentUser;
  if (heroUserNameEl) heroUserNameEl.textContent = currentUser;
  if (userInitialEl) userInitialEl.textContent = currentUser.charAt(0).toUpperCase();
  showPage("dashboard");
}

// Map total (0-100) to grade & cgpa (same rules as teacher dashboard)
function calculateCgpaFromTotal(total) {
  const t = Number(total);
  if (isNaN(t)) return null;
  if (t >= 90) return 4.0;
  if (t >= 86) return 3.67;
  if (t >= 82) return 3.33;
  if (t >= 78) return 3.0;
  if (t >= 74) return 2.67;
  if (t >= 70) return 2.33;
  if (t >= 66) return 2.0;
  if (t >= 62) return 1.67;
  if (t >= 58) return 1.33;
  if (t >= 50) return 1.0;
  return 0.0;
}

// Fetch the student's transcript and compute their overall CGPA (numeric values only)
async function loadStudentCgpa() {
  const studentId = localStorage.getItem('userId');
  const el = document.getElementById('userCgpa');
  if (!el || !studentId) return;

  try {
    const res = await fetch(`/api/student/transcript/${studentId}`);
    if (!res.ok) return (el.textContent = 'N/A');
    const data = await res.json();
    if (!data.success) return (el.textContent = 'N/A');
    const rows = data.transcript || [];
    const numericCgpas = rows
      .map(r => {
        let n = parseFloat(r.cgpa);
        if (isNaN(n) && r.total_marks != null) n = calculateCgpaFromTotal(r.total_marks);
        return n;
      })
      .filter(v => !isNaN(v));
    if (numericCgpas.length > 0) {
      const avg = numericCgpas.reduce((s, v) => s + v, 0) / numericCgpas.length;
      el.textContent = avg.toFixed(2);
    } else {
      el.textContent = 'N/A';
    }
  } catch (err) {
    console.error('Failed to load student CGPA:', err);
    el.textContent = 'N/A';
  }
}

function setupEventListeners() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.dataset.page;
      showPage(page);
      setActiveNavItem(this);
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  // Extra: event delegation so clicks on inner elements (icons/spans) also work reliably
  document.addEventListener('click', function (e) {
    const navItem = e.target.closest && e.target.closest('.nav-item');
    if (navItem) {
      e.preventDefault();
      const page = navItem.dataset.page;
      // small debug log
      console.log('Nav click ->', page);
      showPage(page);
      setActiveNavItem(navItem);
      if (window.innerWidth <= 1024) closeSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeSidebar();
      if (sidebar) {
        sidebar.classList.remove("w-16");
        sidebar.classList.add("w-64");
      }
      if (mainContent) {
        mainContent.classList.remove("ml-16");
        mainContent.classList.add("ml-64");
      }
    }
  });

  const contactForm = document.querySelector(".contact-form form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Message sent successfully! We'll get back to you soon.");
      this.reset();
    });
  }
}


function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar && sidebar.classList) sidebar.classList.replace("-translate-x-full", "translate-x-0");
  if (overlay && overlay.classList) {
    overlay.classList.replace("opacity-0", "opacity-100");
    overlay.classList.replace("invisible", "visible");
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar && sidebar.classList) sidebar.classList.replace("translate-x-0", "-translate-x-full");
  if (overlay && overlay.classList) {
    overlay.classList.replace("opacity-100", "opacity-0");
    overlay.classList.replace("visible", "invisible");
  }
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden");
    page.classList.remove("block");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.remove("hidden");
    targetPage.classList.add("block");
  }

  document.querySelectorAll(".nav-item").forEach((item) => {
    if (item.dataset.page === pageId) setActiveNavItem(item);
  });

  // ✅ Automatically refresh registered courses when navigating
  if (pageId === "registered" && typeof loadRegisteredCourses === "function") {
    loadRegisteredCourses();
  }
  if (pageId === "transcript") {
    loadTranscript();
  }

  // Lazy-load student pages
  if (pageId === 'attendance' && typeof loadStudentAttendance === 'function') {
    loadStudentAttendance();
  }
  if (pageId === 'quizzes' && typeof loadQuizzes === 'function') {
    loadQuizzes();
  }
  if (pageId === 'assignments' && typeof loadAssignments === 'function') {
    loadAssignments();
  }
  if (pageId === 'schedule' && typeof loadStudentSchedule === 'function') {
    loadStudentSchedule();
  }


}

function setActiveNavItem(activeItem) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove(
      "bg-white",
      "bg-opacity-20",
      "text-white",
      "font-medium"
    );
    item.classList.add(
      "text-white",
      "text-opacity-70",
      "hover:text-white",
      "hover:bg-white",
      "hover:bg-opacity-10"
    );
  });

  activeItem.classList.remove(
    "text-white",
    "text-opacity-70",
    "hover:text-white",
    "hover:bg-white",
    "hover:bg-opacity-10"
  );
  activeItem.classList.add(
    "bg-white",
    "bg-opacity-20",
    "text-white",
    "font-medium"
  );
}

// ✅ Final Course Enrollment Function
function enrollCourse(courseId) {
  const courseMap = {
    1: { name: "Full-Stack Web Development", duration: "8 weeks" },
    2: { name: "Data Science & ML", duration: "10 weeks" },
    3: { name: "UX/UI Design Mastery", duration: "6 weeks" },
  };

  const course = courseMap[courseId];
  if (!course) return alert("Invalid course selected.");

  fetch("/api/student/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: currentUserId,
      course_id: courseId
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Server error");
      return res.json();
    })
    .then((response) => {
      if (response.success) {
        alert(`${course.name} enrolled successfully!`);
        showPage("registered"); // ✅ This now triggers loadRegisteredCourses
        loadEnrolledCourses(); // ✅ Refresh button states
      } else {
        console.error("Enrollment failed:", response);
        alert("Enrollment failed: " + (response.error || "Unknown error"));
      }
    })
    .catch((err) => {
      console.error("❌ Enrollment error:", err);
      alert("Enrollment failed. " + (err.message || err));
    });
}

// ✅ Load enrolled courses and update buttons
// ✅ Load enrolled courses ONLY for current user
function loadEnrolledCourses() {
  if (!currentUserId) return;

  // Get all enrollments for the current student
  fetch(`/api/student/enrollments/${currentUserId}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to load enrollments');
      }
      if (Array.isArray(data.enrollments)) {
        // Save enrolled course IDs
        enrolledCourseIds = data.enrollments.map(enrollment => parseInt(enrollment.course_id));
        updateCourseButtons();
      } else {
        console.warn('No enrollments data received');
      }
    })
    .catch((err) => {
      console.error("❌ Failed to load enrolled courses:", err);
      // If we get HTML instead of JSON, it likely means the server is down or not running
      if (err.message.includes('Unexpected token')) {
        console.error("Server may not be running. Please start the server first.");
      }
    });
}

// ✅ Load and display registered courses ONLY for current user
async function loadRegisteredCourses() {
  if (!currentUserId) return;

  try {
    const response = await fetch(`/api/student/enrollments/${currentUserId}`);
    const data = await response.json();
    const container = document.getElementById("registeredList") || null;
    container.innerHTML = "";

    if (!data.success || !Array.isArray(data.enrollments) || data.enrollments.length === 0) {
      container.innerHTML = `<p class="text-gray-600">You haven't enrolled in any courses yet.</p>`;
      return;
    }

    // Create array of promises for fetching course details
    const promises = data.enrollments.map(enrollment =>
      fetch(`/api/courses/${enrollment.course_id}`)
        .then(res => res.json())
        .then(courseData => {
          if (!courseData.success) {
            throw new Error(courseData.error || 'Failed to fetch course details');
          }
          return courseData.course;
        })
    );

    // Wait for all course details to be fetched
    const courses = await Promise.all(promises);
    courses.forEach(course => {
      container.innerHTML += `
        <div class="bg-white p-6 rounded-xl shadow-md">
          <h2 class="text-xl font-bold text-blue-700">${course.name}</h2>
          <p class="text-gray-600 mb-2">Duration: 8 weeks</p>
          <p class="text-gray-600 mb-4">Status: <span class="text-green-600 font-semibold">Enrolled</span></p>
          <button class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">Enrolled</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("❌ Failed to load registered courses:", err);
    const container = document.getElementById("registeredList");
    if (container) {
      container.innerHTML = `<p class="text-red-600">Error loading courses. Please try again later.</p>`;
    }
  }
}


// ✅ Update course buttons to reflect enrollment
function updateCourseButtons() {
  document.querySelectorAll("[data-course-id]").forEach((button) => {
    const courseId = parseInt(button.dataset.courseId);
    if (enrolledCourseIds.includes(courseId)) {
      button.textContent = "Continue";
      button.classList.remove("bg-blue-700", "hover:bg-blue-800");
      button.classList.add("bg-gray-400", "cursor-not-allowed");
      button.disabled = true;
    }
  });
}


async function loadTranscript() {
  const studentId = localStorage.getItem("userId"); // 👈 we stored this at login
  if (!studentId) {
    console.warn("⚠️ No logged-in user, cannot load transcript.");
    return;
  }

  try {
    // Use the transcript endpoint which returns enrollments + saved grades (if any)
    const res = await fetch(`/api/student/transcript/${studentId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load transcript');

    const tbody = document.getElementById('transcriptCoursesBody');
    tbody.innerHTML = '';
    const rows = data.transcript || [];
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No courses enrolled yet.</td></tr>`;
      return;
    }

    rows.forEach(r => {
      const courseName = r.name || 'Unknown Course';
      const duration = '3'; // fixed duration as requested
      const grade = r.grade || 'N/A';
      const status = (r.grade && r.grade !== 'F') ? 'Pass' : (r.grade === 'F' ? 'Fail' : 'Enrolled');

      // Safely parse cgpa: backend may return null/empty; if missing try to compute from total_marks
      let cgpaNum = parseFloat(r.cgpa);
      if (isNaN(cgpaNum) && r.total_marks != null) {
        const computed = calculateCgpaFromTotal(r.total_marks);
        cgpaNum = computed != null ? Number(computed) : NaN;
      }
      const cgpaStr = !isNaN(cgpaNum) ? ` (${cgpaNum.toFixed(2)})` : '';
      const gradeDisplay = r.grade ? (r.grade + cgpaStr) : 'N/A';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-4 py-3">${courseName}</td>
        <td class="px-4 py-3">${duration}</td>
        <td class="px-4 py-3">${status}</td>
        <td class="px-4 py-3">${gradeDisplay}</td>
      `;
      tbody.appendChild(row);
    });

    // Compute average CGPA using only numeric values
    const numericCgpas = rows
      .map(r => {
        let n = parseFloat(r.cgpa);
        if (isNaN(n) && r.total_marks != null) n = calculateCgpaFromTotal(r.total_marks);
        return n;
      })
      .filter(v => !isNaN(v));
    const avgEl = document.getElementById('avgCgpa');
    if (numericCgpas.length > 0) {
      const sum = numericCgpas.reduce((s, v) => s + v, 0);
      const avg = sum / numericCgpas.length;
      if (avgEl) avgEl.textContent = avg.toFixed(2);
    } else {
      if (avgEl) avgEl.textContent = 'N/A';
    }
  } catch (err) {
    console.error("❌ Failed to fetch transcript:", err);
  }
}


// Logout function
function logout() {
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail"); // ✅ clear email too
  alert("Logged out successfully!");
  currentUser = "Student";
  currentUserId = null;
  currentUserEmail = "";
  initializeApp();
}

// Updated attendance loading function
async function loadStudentAttendance() {
  const studentId = localStorage.getItem('userId');
  const container = document.getElementById('attendanceGrid');

  if (!studentId) {
    container.innerHTML = '<div class="text-red-600 p-4 text-center">Please login to view attendance.</div>';
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="text-center py-4">
      <div class="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      <p class="mt-2 text-gray-600">Loading attendance records...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/student/attendance/${studentId}`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const response = await res.json();
    if (!response.success) {
      throw new Error(response.error || 'Failed to load attendance');
    }

    const data = response.data;
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-gray-600 p-4 text-center">No attendance records found.</div>';
      return;
    }

    // Render attendance records
    container.innerHTML = `
      <div class="grid gap-6">
        ${data.map(course => `
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold mb-2">${course.course_name}</h3>
                <div class="flex gap-4 text-sm">
                  <span class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    Present: ${course.present_count}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    Absent: ${course.absent_count}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <span class="inline-block px-3 py-1 rounded-full text-sm font-medium 
                  ${course.attendance_percentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  ${course.attendance_percentage}% Attendance
                </span>
              </div>
            </div>
            <div class="border-t pt-4 mt-4">
              <h4 class="font-semibold mb-2">Attendance History</h4>
              <div class="grid gap-2">
                ${(course.attendance_details || []).map(record => `
                  <div class="flex justify-between items-center py-2 px-3 rounded ${record.status === 'present' ? 'bg-green-50' : 'bg-red-50'
      }">
                    <span class="text-sm">${new Date(record.date).toLocaleDateString()}</span>
                    <span class="px-2 py-1 rounded text-xs font-medium ${record.status === 'present'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'
      }">
                      ${record.status}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading attendance:', error);
    container.innerHTML = `
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <div class="font-bold">Error</div>
        <div>${error.message}</div>
        <button onclick="loadStudentAttendance()" class="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Try Again
        </button>
      </div>
    `;
  }
}

// Utility function
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Add hover effects
function addInteractiveEffects() {
  document
    .querySelectorAll(
      ".course-card, .feature-card, .testimonial-card, .stat-card"
    )
    .forEach((card) => {
      card.addEventListener(
        "mouseenter",
        () => (card.style.transform = "translateY(-8px)")
      );
      card.addEventListener(
        "mouseleave",
        () => (card.style.transform = "translateY(0)")
      );
    });
}

/* ---------------- Student: Attendance / Quizzes / Assignments ---------------- */

// Function to submit an assignment
window.submitAssignment = function (assignmentId) {
  const studentId = localStorage.getItem('userId');
  if (!studentId) {
    alert('You must be logged in to submit assignments.');
    return;
  }

  if (!confirm('Are you sure you want to submit this assignment?')) {
    return;
  }

  fetch(`/api/student/assignment/${assignmentId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId })
  })
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        alert('Assignment submitted successfully!');
        // Reload the assignments to show updated status
        loadAssignments();
      } else {
        alert('Failed to submit assignment: ' + (response.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment. Please try again.');
    });
};


let currentQuiz = null;
let quizTimerInterval = null;

async function loadQuizzes() {
  const studentId = localStorage.getItem('userId');
  const container = document.getElementById('quizzesGrid');

  if (!studentId) {
    container.innerHTML = '<div class="text-red-600">Please login to view quizzes.</div>';
    window.location.href = 'login.html';
    return;
  }

  container.innerHTML = '<div class="text-center py-4"><div class="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div><p class="mt-2 text-gray-600">Loading quizzes...</p></div>';

  try {
    const res = await fetch(`/api/student/${studentId}/quizzes`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load quizzes');
    }

    const quizzes = data.quizzes;
    if (!quizzes || quizzes.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-600 p-4">No active quizzes available.</div>';
      return;
    }

    container.innerHTML = `
      <div class="grid gap-6">
        ${quizzes.map(q => `
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-xl font-bold mb-2">${q.title}</h3>
                <p class="text-gray-600 mb-2">${q.description || ''}</p>
                <p class="text-sm text-gray-500">Course: ${q.course_name}</p>
                <p class="text-sm text-gray-500">Time limit: ${q.time_limit} minutes</p>
                ${q.submitted_at ? `
                  <div class="mt-4">
                    <p class="text-green-600 font-semibold">Score: ${q.student_score}/${q.total_questions}</p>
                    <p class="text-sm text-gray-500">Submitted: ${new Date(q.submitted_at).toLocaleString()}</p>
                  </div>
                ` : ''}
              </div>
              ${!q.submitted_at && q.is_active ? `
                <button onclick="startQuiz(${q.quiz_id})" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200">
                  Start Quiz
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load quizzes', err);
    container.innerHTML = '<div class="text-red-600">Network error while loading quizzes.</div>';
  }
}

async function startQuiz(quizId) {
  const studentId = localStorage.getItem('userId');
  if (!studentId) {
    alert('Please login to take quizzes');
    window.location.href = 'login.html';
    return;
  }

  try {
    // Show loading state
    // Avoid creating multiple overlays; use a predictable id so we can remove the exact element later
    let loadingEl = document.getElementById('quiz-loading-overlay');
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.id = 'quiz-loading-overlay';
      loadingEl.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    }
    loadingEl.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p class="text-gray-700">Loading quiz...</p>
      </div>
    `;
    // Append it if it's not already in the document
    if (!loadingEl.parentElement) document.body.appendChild(loadingEl);

    // Helper: fetch with timeout to avoid hanging forever
    const fetchWithTimeout = (url, opts = {}, timeout = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      opts.signal = controller.signal;
      return fetch(url, opts)
        .finally(() => clearTimeout(id));
    };

    // First check if the server is running (with timeout)
    try {
      const serverCheck = await fetchWithTimeout('/api/health', {}, 10000);
      if (!serverCheck.ok) {
        throw new Error('Server is not responding properly');
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Server check timed out. Please ensure the server is running.');
      }
      throw new Error('Unable to connect to server. Please ensure the server is running.');
    }

    // Use the existing server endpoint that returns quiz questions
    // Server exposes: GET /api/student/quiz/:quizId/questions
    let quizData;
    try {
      const quizRes = await fetchWithTimeout(`/api/student/quiz/${quizId}/questions`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }, 10000);
      if (!quizRes.ok) {
        if (quizRes.status === 404) {
          throw new Error('This quiz is not currently available or has expired');
        }
        throw new Error(`Unable to access quiz: ${quizRes.statusText}`);
      }
      quizData = await quizRes.json();
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Loading the quiz timed out. Please try again.');
      }
      throw e;
    }
    if (!quizData.success) {
      throw new Error(quizData.error || 'Quiz is not available at this time');
    }

    // Server returns the quiz under quizData.quiz (may use timeLimit or time_limit keys)
    const quiz = quizData.quiz;
    // normalize id fields so other code can reference either quiz_id or quizId
    if (quiz) {
      if (!quiz.quiz_id && quiz.quizId) quiz.quiz_id = quiz.quizId;
      if (!quiz.quizId && quiz.quiz_id) quiz.quizId = quiz.quiz_id;
    }
    // normalize question options and time limit field names for compatibility
    if (quiz && Array.isArray(quiz.questions)) {
      quiz.questions = quiz.questions.map(q => {
        // options might already be an array or a JSON string
        if (typeof q.options === 'string') {
          try { q.options = JSON.parse(q.options); } catch (e) { /* keep as-is */ }
        }
        return q;
      });
    }
    // normalize time limit
    if (quiz && (quiz.timeLimit && !quiz.time_limit)) {
      quiz.time_limit = quiz.timeLimit;
    }
    if (quiz && (quiz.time_limit && !quiz.timeLimit)) {
      quiz.timeLimit = quiz.time_limit;
    }
    currentQuiz = quiz;

    // Update the quiz modal
    document.getElementById('quizTitle').textContent = quiz.title;
    const content = document.getElementById('quizContent');
    content.innerHTML = '';

    // Create questions
    quiz.questions.forEach((q, idx) => {
      const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
      content.innerHTML += `
        <div class="bg-white p-6 rounded-lg shadow-md mb-4">
          <div class="font-semibold text-lg mb-3">${idx + 1}. ${q.question_text}</div>
          <div class="space-y-2">
            ${options.map((opt, i) => `
              <label class="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="q_${q.question_id}" value="${i}" class="mt-1" />
                <span class="text-gray-700">${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });

    // Show the modal
    document.getElementById('quizModal').classList.remove('hidden');

    // Setup timer
    if (quiz.time_limit) {
      let remaining = quiz.time_limit * 60; // convert to seconds
      const timerEl = document.getElementById('quizTimer');

      clearInterval(quizTimerInterval);
      quizTimerInterval = setInterval(() => {
        if (remaining <= 0) {
          clearInterval(quizTimerInterval);
          submitQuiz(true); // true indicates time's up
          return;
        }

        remaining--;
        const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
        const secs = (remaining % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;

        // Add warning colors
        if (remaining <= 60) { // last minute
          timerEl.classList.add('text-red-600', 'font-bold');
        }
      }, 1000);
    }
  } catch (err) {
    console.error('Error starting quiz:', err);
    const errorMessage = document.createElement('div');
    errorMessage.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    errorMessage.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="text-red-600 mb-4">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3 class="text-lg font-semibold text-center">Unable to Start Quiz</h3>
        </div>
        <p class="text-gray-600 text-center mb-6">${err.message || 'Failed to start quiz. Please try again.'}</p>
        <div class="flex justify-center">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorMessage);
  } finally {
    // Remove the loading indicator by id (safer and avoids selector mismatches)
    const existing = document.getElementById('quiz-loading-overlay');
    if (existing) {
      existing.remove();
      console.log('Removed quiz loading overlay');
    }
  }
}

function closeQuiz() {
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }

  // Reset the timer display if it exists
  const timerEl = document.getElementById('quizTimer');
  if (timerEl) {
    timerEl.textContent = '';
    timerEl.classList.remove('text-red-600', 'font-bold');
  }

  // Reset the quiz state
  currentQuiz = null;

  // Hide the modal with a fade effect
  const modal = document.getElementById('quizModal');
  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('opacity-0');

      // Clear the content after hiding
      const title = document.getElementById('quizTitle');
      if (title) title.textContent = '';

      const content = document.getElementById('quizContent');
      if (content) content.innerHTML = '';
    }, 200);
  }
}

async function submitQuiz(isTimeUp = false) {
  if (!currentQuiz) return;

  if (!isTimeUp && !confirm('Are you sure you want to submit this quiz?')) {
    return;
  }

  const studentId = localStorage.getItem('userId');
  if (!studentId) {
    alert('Please login to submit quizzes');
    window.location.href = 'login.html';
    return;
  }

  // Disable the submit button and show loading state
  const submitBtn = document.querySelector('#quizSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="inline-block animate-spin mr-2">↻</span>
      Submitting...
    `;
  }

  try {
    // Collect answers
    const answers = {};
    const answeredQuestions = new Set();

    (currentQuiz.questions || []).forEach(q => {
      const radios = document.getElementsByName('q_' + q.question_id);
      for (let r of radios) {
        if (r.checked) {
          answers[q.question_id] = parseInt(r.value);
          answeredQuestions.add(q.question_id);
          break;
        }
      }
    });

    // Warning if not all questions are answered (unless time's up)
    if (!isTimeUp && answeredQuestions.size < currentQuiz.questions.length) {
      const unanswered = currentQuiz.questions.length - answeredQuestions.size;
      if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Do you still want to submit?`)) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Quiz';
        }
        return;
      }
    }

    // Submit to server
    const res = await fetch(`/api/student/quiz/${currentQuiz.quiz_id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        answers,
        is_timeout: isTimeUp
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to submit quiz');
    }

    // Show results
    const score = data.score;
    const total = currentQuiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    document.getElementById('quizContent').innerHTML = `
      <div class="text-center py-8">
        <div class="mb-4">
          ${percentage >= 70 ?
        '<div class="text-6xl mb-4 text-green-500">🎉</div>' :
        '<div class="text-6xl mb-4">📝</div>'
      }
        </div>
        <h2 class="text-2xl font-bold mb-2">Quiz Completed!</h2>
        <div class="text-4xl font-bold mb-4 ${percentage >= 70 ? 'text-green-600' :
        percentage >= 50 ? 'text-yellow-600' :
          'text-red-600'
      }">
          ${score}/${total} (${percentage}%)
        </div>
        <p class="text-gray-600 mb-6">
          ${isTimeUp ? 'Time ran out - quiz was automatically submitted.' : 'Quiz submitted successfully.'}
        </p>
        <button onclick="closeQuiz()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200">
          Close
        </button>
      </div>
    `;

    // Refresh quiz list in background
    loadQuizzes();

  } catch (err) {
    console.error('Error submitting quiz:', err);
    alert(err.message || 'Failed to submit quiz. Please try again.');

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Quiz';
    }
  }
}

async function loadAssignments() {
  const studentId = localStorage.getItem('userId');
  const container = document.getElementById('assignmentsGrid');

  if (!studentId) {
    container.innerHTML = '<div class="text-red-600">Please login to view assignments.</div>';
    window.location.href = 'login.html';
    return;
  }

  container.innerHTML = '<div class="text-center py-4"><div class="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div><p class="mt-2 text-gray-600">Loading assignments...</p></div>';
  try {
    const res = await fetch(`/api/student/${studentId}/assignments`);
    const data = await res.json();
    const assignments = data.assignments || data;
    if (!assignments || assignments.length === 0) {
      container.innerHTML = '<div class="text-gray-600">No assignments available.</div>';
      return;
    }
    container.innerHTML = '';
    assignments.forEach(a => {
      container.innerHTML += `
        <div class="bg-white p-4 rounded-lg shadow-md">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">${a.title}</div>
              <div class="text-sm text-gray-600">${a.description || ''}</div>
              <div class="text-sm text-gray-500 mt-1">Due: ${a.due_date ? new Date(a.due_date).toLocaleString() : 'No due date'}</div>
            </div>
            <div class="text-right">
              <a href="${a.link || '#'}" target="_blank" class="text-blue-700 underline">Open</a>
              <div class="mt-2 font-semibold">Marks: ${a.marks != null ? a.marks : 'Not graded'}</div>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('loadAssignments error', err);
    container.innerHTML = '<div class="text-red-600">Network error loading assignments.</div>';
  }
}
