* Migration notes

## Run

```bash
npm install            # new deps: lucide-react, html2canvas, jspdf
cp .env.local.example .env.local
npm run dev            # http://localhost:4000  (backend stays on :3000)
```

## Routes

| Old file                                 | New route                                                                                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login.html`                           | `/login` (`/` redirects here)                                                                                                                                      |
| `student-landing.html` (dashboard tab) | `/student/landing`                                                                                                                                                   |
| …its other tabs                         | `/student/courses`, `/attendance`, `/quizzes`, `/assignments`, `/reviews`, `/transcript`, `/schedule`, `/fee-challans`, `/change-password`           |
| `teachers.html`                        | `/teachers` → redirects to `/teacher/dashboard`                                                                                                                   |
| `teacher-dashboard.html`               | `/teacher/dashboard`, `/courses`, `/attendance`, `/quizzes`, `/assignments`, `/marks`, `/reviews`, `/schedule`, `/change-password`                   |
| `admin-dashboard.html`                 | `/admin/dashboard`, `/students`, `/teachers`, `/courses`, `/enrollments`, `/scheduling`, `/enrollment-requests`, `/fee-challans`, `/change-password` |

## Old file -> new location

| Old                                                      | New                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `app.js` (login, forgot password, theme)               | `components/auth/LoginForm.tsx`, `lib/auth.ts`, `components/ui/ThemeSync.tsx`    |
| `lms-ui.js` (Toast, LmsModal)                          | `lib/toast-store.ts` + `components/ui/ToastViewport.tsx`, `ConfirmModalHost.tsx` |
| `mobile-sidebar.js`                                    | `components/layout/SidebarProvider.tsx`, `Sidebar.tsx`, `Navbar.tsx`             |
| `utils.js` + inline script of `student-landing.html` | `lib/student/{api,helpers,types}.ts` and `components/student/*View.tsx`            |
| `script.js`, `main.js`                               | not needed (page switching is routing now; main.js only loaded app.js)                 |

## Dead code in the old student page (intentionally not ported)

- `loadStudentCgpa()` (needs `#userCgpa`, which doesn't exist in the HTML)
- `loadRegisteredCourses()` / `updateCourseButtons()` / the first `enrollCourse()` in utils.js (overridden by the inline `window.enrollCourse`; no `#registeredList` element)
- `addInteractiveEffects()` (no `.course-card` / `.stat-card` elements)

## Teacher / admin notes

- Teacher "My Courses" buttons now link to `/teacher/attendance?course=ID` etc.; the selected course lives in the URL (`useCourseParam`).
- Admin "Add Student/Teacher/Course" quick actions link to `/admin/students?new=1` (etc.), which opens the add form.
- Shared data: `TeacherCoursesProvider` replaces the global `teacherCourses`; `AdminDataProvider` replaces `window._cachedStudents/Teachers/Courses/Enrollments`.
- Old admin `<style>` block is in `globals.css` (scoped to `.admin-root`, inside cascade layers so Tailwind classes still win).

## Bugs in the old admin page (behaviour differs on purpose)

- The **Save Schedule** and **Save Open Enrollment Window** handlers sat inside a second `DOMContentLoaded` callback that returned immediately (`_adminDashboardInit` was already set), so they were never attached. They work now.
- The review-window buttons (`toggle-reviews`, `activate-all-*`, ...) had click handlers but no matching markup anywhere; not ported.
- The add-student/teacher "record exists despite error" fallback compared against `body.email` (never set), so it could never trigger; replaced with a plain error message.
- `/admin/*` is now guarded (role must be admin); the old page had no guard.
