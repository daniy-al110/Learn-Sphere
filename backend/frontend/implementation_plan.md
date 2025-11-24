# Optimize Admin Dashboard for Mobile

## Goal Description
Improve the responsiveness of `admin-dashboard.html` so that the admin interface works well on mobile devices. This includes making the sidebar collapsible, ensuring content sections adapt to smaller screens, and adjusting any layout elements that may overflow.

## Proposed Changes
### admin-dashboard.html
- Add a mobile toggle button for the sidebar.
- Apply Tailwind responsive utility classes to hide the sidebar on small screens and show it on larger screens.
- Adjust main content padding and width for mobile.
- Ensure tables are scrollable on small screens.

## Verification Plan
### Manual Verification
- Open the admin dashboard on a mobile device or using browser dev tools responsive mode.
- Verify the sidebar can be toggled via the new button.
- Ensure all sections are readable and no horizontal scrolling occurs.
- Check that tables are horizontally scrollable within their container.

### Automated Tests
- No existing automated tests for UI responsiveness; will rely on manual verification.
