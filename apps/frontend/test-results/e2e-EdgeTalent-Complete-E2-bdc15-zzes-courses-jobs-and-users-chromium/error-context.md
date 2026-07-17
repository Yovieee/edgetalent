# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Admin Journey: login/onboard as admin and manage quizzes, courses, jobs, and users
- Location: test\e2e.spec.ts:589:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2').filter({ hasText: 'Overview Management' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2').filter({ hasText: 'Overview Management' })

```

```yaml
- complementary:
  - img "EdgeTalent Logo"
  - text: EdgeTalent
  - link "Stats Overview":
    - /url: "#/admin/overview"
  - link "User Management":
    - /url: "#/admin/users"
  - link "Course Catalog":
    - /url: "#/admin/courses"
  - link "Projects Desk":
    - /url: "#/admin/marketplace"
  - link "Quiz Questions":
    - /url: "#/admin/quizzes"
  - link "Funding Opportunities":
    - /url: "#/admin/funding"
  - link "Events Manager":
    - /url: "#/admin/events"
- banner:
  - button
  - heading "Stats Overview" [level=2]
  - text: Mock Administrator Admin M
- main:
  - paragraph: Total Users
  - heading "3" [level=3]
  - text: 👥
  - paragraph: Registered Talents
  - heading "1" [level=3]
  - text: 💻
  - paragraph: Partner Organizations
  - heading "1" [level=3]
  - text: 🏢
  - paragraph: Upskilling Courses
  - heading "0" [level=3]
  - text: 🎓
  - paragraph: Active Projects
  - heading "0" [level=3]
  - text: 💼
  - paragraph: Quiz Questions
  - heading "0" [level=3]
  - text: 📝
  - heading "Welcome to the EdgeTalent Admin Console" [level=3]
  - paragraph: As an administrator, you have complete read and write access to all databases. You can oversee assessment quizzes, introduce new upskilling hub resources, manage the corporate projects/job postings marketplace, and control user roles. Use the sidebar tabs to access specific tables and control options.
```

# Test source

```ts
  666 |         await route.fulfill({
  667 |           status: 200,
  668 |           contentType: 'application/json',
  669 |           body: JSON.stringify(mockQuestions)
  670 |         });
  671 |       } else if (method === 'POST') {
  672 |         const body = JSON.parse(route.request().postData() || '{}');
  673 |         const newQ = {
  674 |           id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
  675 |           category: body.category,
  676 |           question: body.question,
  677 |           options: body.options,
  678 |           answer: body.answer,
  679 |           created_at: new Date().toISOString()
  680 |         };
  681 |         mockQuestions.push(newQ);
  682 |         await route.fulfill({
  683 |           status: 200,
  684 |           contentType: 'application/json',
  685 |           body: JSON.stringify(newQ)
  686 |         });
  687 |       } else {
  688 |         await route.fulfill({
  689 |           status: 200,
  690 |           contentType: 'application/json',
  691 |           body: JSON.stringify({ success: true })
  692 |         });
  693 |       }
  694 |     });
  695 | 
  696 |     // Intercept courses endpoint
  697 |     let mockCourses = [
  698 |       {
  699 |         id: "00000000-0000-0000-0000-000000000020",
  700 |         title: "Introduction to AI",
  701 |         description: "Basic artificial intelligence concepts.",
  702 |         skills_taught: ["AI", "Python"],
  703 |         provider: "EdgeTalent Academy",
  704 |         link: "https://example.com",
  705 |         created_at: new Date().toISOString()
  706 |       }
  707 |     ];
  708 |     await page.route('**/rest/v1/courses**', async (route) => {
  709 |       const method = route.request().method();
  710 |       if (method === 'GET') {
  711 |         await route.fulfill({
  712 |           status: 200,
  713 |           contentType: 'application/json',
  714 |           body: JSON.stringify(mockCourses)
  715 |         });
  716 |       } else if (method === 'POST') {
  717 |         const body = JSON.parse(route.request().postData() || '{}');
  718 |         const newC = {
  719 |           id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
  720 |           title: body.title,
  721 |           description: body.description,
  722 |           skills_taught: body.skills_taught,
  723 |           provider: body.provider,
  724 |           link: body.link,
  725 |           created_at: new Date().toISOString()
  726 |         };
  727 |         mockCourses.push(newC);
  728 |         await route.fulfill({
  729 |           status: 200,
  730 |           contentType: 'application/json',
  731 |           body: JSON.stringify(newC)
  732 |         });
  733 |       } else {
  734 |         await route.fulfill({
  735 |           status: 200,
  736 |           contentType: 'application/json',
  737 |           body: JSON.stringify({ success: true })
  738 |         });
  739 |       }
  740 |     });
  741 | 
  742 |     // Users list queries are now handled by the unified profiles router above
  743 | 
  744 |     // 1. Visit Landing Page and Navigate to Auth
  745 |     await page.goto('/');
  746 |     const getStartedBtn = page.locator('button#nav-btn-register');
  747 |     await getStartedBtn.click();
  748 | 
  749 |     // 2. Register a new user (who will have mock admin role via routing intercept)
  750 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  751 |     await toggleToSignUpBtn.click();
  752 | 
  753 |     const fullNameInput = page.locator('input#fullName');
  754 |     const emailInput = page.locator('input#email');
  755 |     const passwordInput = page.locator('input#password');
  756 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  757 | 
  758 |     const testEmail = `admin.${Date.now()}@edgetalent.com`;
  759 |     await fullNameInput.fill('Mock Administrator');
  760 |     await emailInput.fill(testEmail);
  761 |     await passwordInput.fill('supersecret123');
  762 |     await submitBtn.click();
  763 | 
  764 |     // 3. Verify redirected to Admin Dashboard and check welcome/stats
  765 |     const welcomeHeader = page.locator('h2', { hasText: 'Overview Management' });
> 766 |     await expect(welcomeHeader).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  767 | 
  768 |     const welcomeBody = page.locator('p', { hasText: 'As an administrator, you have complete read and write access' });
  769 |     await expect(welcomeBody).toBeVisible();
  770 | 
  771 |     // 4. Navigate to Users tab
  772 |     const usersTabBtn = page.locator('button', { hasText: 'Users List' });
  773 |     await usersTabBtn.click();
  774 |     const usersTitle = page.locator('h3', { hasText: 'Users Accounts Profiles' });
  775 |     await expect(usersTitle).toBeVisible();
  776 |     const developerRow = page.locator('td', { hasText: 'Alex Developer' });
  777 |     await expect(developerRow).toBeVisible();
  778 | 
  779 |     // 5. Navigate to Quizzes tab and add a quiz question
  780 |     const quizzesTabBtn = page.locator('button', { hasText: 'Quizzes' });
  781 |     await quizzesTabBtn.click();
  782 |     const quizzesTitle = page.locator('h3', { hasText: 'Assessment Quiz Questions' });
  783 |     await expect(quizzesTitle).toBeVisible();
  784 | 
  785 |     // Add quiz question
  786 |     const addQuestionBtn = page.locator('button', { hasText: 'Add Question' });
  787 |     await addQuestionBtn.click();
  788 | 
  789 |     await page.locator('textarea[placeholder*="handles state"]').fill('Which React hook is used to run side effects?');
  790 |     await page.locator('input[placeholder="Option A"]').fill('useEffect');
  791 |     await page.locator('input[placeholder="Option B"]').fill('useState');
  792 |     await page.locator('input[placeholder="Option C"]').fill('useContext');
  793 |     await page.locator('input[placeholder="Option D"]').fill('useReducer');
  794 |     await page.locator('select:has-text("-- Select Answer --")').selectOption('useEffect');
  795 | 
  796 |     await page.locator('button', { hasText: 'Create Question' }).click();
  797 | 
  798 |     // Verify question is added in frontend
  799 |     const newQuestion = page.locator('p', { hasText: 'Which React hook is used to run side effects?' });
  800 |     await expect(newQuestion).toBeVisible();
  801 | 
  802 |     // 6. Navigate to Courses tab and add a course
  803 |     const coursesTabBtn = page.locator('button', { hasText: 'Upskilling Hub' });
  804 |     await coursesTabBtn.click();
  805 |     const coursesTitle = page.locator('h3', { hasText: 'Upskilling Courses Catalog' });
  806 |     await expect(coursesTitle).toBeVisible();
  807 | 
  808 |     const addCourseBtn = page.locator('button', { hasText: 'Add Course' });
  809 |     await addCourseBtn.click();
  810 | 
  811 |     await page.locator('input[placeholder*="React & Node"]').fill('Tailwind CSS Mastery');
  812 |     await page.locator('textarea[placeholder*="Summarize course"]').fill('Learn utility-first styling patterns.');
  813 |     await page.locator('input[placeholder="React, TypeScript, Node.js"]').fill('TailwindCSS, CSS');
  814 |     await page.locator('input[placeholder*="Coursera"]').fill('Frontend Masters');
  815 |     await page.locator('input[placeholder*="example.com"]').fill('https://example.com/tailwind');
  816 | 
  817 |     await page.locator('button', { hasText: 'Create Course' }).click();
  818 | 
  819 |     // Verify course added
  820 |     const newCourse = page.locator('h4', { hasText: 'Tailwind CSS Mastery' });
  821 |     await expect(newCourse).toBeVisible();
  822 | 
  823 |     // 6.5 Navigate to Manage Funding tab and add a funding opportunity
  824 |     const fundingTabBtn = page.locator('button', { hasText: 'Manage Funding' });
  825 |     await fundingTabBtn.click();
  826 |     const fundingTitleHeader = page.locator('h3', { hasText: 'Funding Opportunities' });
  827 |     await expect(fundingTitleHeader).toBeVisible();
  828 | 
  829 |     const addFundingBtn = page.locator('button', { hasText: 'Add Funding Opportunity' });
  830 |     await addFundingBtn.click();
  831 | 
  832 |     await page.locator('input[placeholder*="Y Combinator W27"]').fill('Thiel Fellowship W27');
  833 |     await page.locator('form select').selectOption('Grants');
  834 |     await page.locator('input[placeholder*="Brief 1-sentence summary"]').fill('A fellowship program for young builders.');
  835 |     await page.locator('textarea[placeholder*="Detailed explanation"]').fill('Thiel Fellowship is a two-year program giving $100k.');
  836 |     await page.locator('input[placeholder*="$500,000"]').fill('$100,000');
  837 |     await page.locator('input[placeholder*="Tech startups"]').fill('Under 22 years old');
  838 |     await page.locator('input[placeholder*="September 15, 2026"]').fill('Rolling');
  839 |     await page.locator('input[placeholder*="example.com/apply"]').fill('https://www.thielfellowship.org/');
  840 | 
  841 |     await page.locator('button', { hasText: 'Create Opportunity' }).click();
  842 | 
  843 |     // Verify funding opportunity added
  844 |     const newFunding = page.locator('td', { hasText: 'Thiel Fellowship W27' });
  845 |     await expect(newFunding).toBeVisible();
  846 | 
  847 |     // 7. Logout
  848 |     const logoutBtn = page.locator('button', { hasText: 'Logout' });
  849 |     await logoutBtn.click();
  850 | 
  851 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  852 |     await expect(welcomeBackHeader).toBeVisible();
  853 |   });
  854 | });
  855 | 
  856 | 
```