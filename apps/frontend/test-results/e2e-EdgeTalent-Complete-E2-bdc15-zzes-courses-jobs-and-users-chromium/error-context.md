# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Admin Journey: login/onboard as admin and manage quizzes, courses, jobs, and users
- Location: test\e2e.spec.ts:527:3

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
- button "← Back to Home"
- heading "Create Account" [level=2]
- paragraph: Join the EdgeTalent ecosystem today
- text: Full Name
- textbox "Full Name":
  - /placeholder: John Doe
  - text: Mock Administrator
- text: Email Address
- textbox "Email Address":
  - /placeholder: name@example.com
  - text: admin.1784181550569@edgetalent.com
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
  - text: supersecret123
- button "Processing..." [disabled]
- text: Already have an account?
- button "Log In"
```

# Test source

```ts
  604 |         await route.fulfill({
  605 |           status: 200,
  606 |           contentType: 'application/json',
  607 |           body: JSON.stringify(mockQuestions)
  608 |         });
  609 |       } else if (method === 'POST') {
  610 |         const body = JSON.parse(route.request().postData() || '{}');
  611 |         const newQ = {
  612 |           id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
  613 |           category: body.category,
  614 |           question: body.question,
  615 |           options: body.options,
  616 |           answer: body.answer,
  617 |           created_at: new Date().toISOString()
  618 |         };
  619 |         mockQuestions.push(newQ);
  620 |         await route.fulfill({
  621 |           status: 200,
  622 |           contentType: 'application/json',
  623 |           body: JSON.stringify(newQ)
  624 |         });
  625 |       } else {
  626 |         await route.fulfill({
  627 |           status: 200,
  628 |           contentType: 'application/json',
  629 |           body: JSON.stringify({ success: true })
  630 |         });
  631 |       }
  632 |     });
  633 | 
  634 |     // Intercept courses endpoint
  635 |     let mockCourses = [
  636 |       {
  637 |         id: "00000000-0000-0000-0000-000000000020",
  638 |         title: "Introduction to AI",
  639 |         description: "Basic artificial intelligence concepts.",
  640 |         skills_taught: ["AI", "Python"],
  641 |         provider: "EdgeTalent Academy",
  642 |         link: "https://example.com",
  643 |         created_at: new Date().toISOString()
  644 |       }
  645 |     ];
  646 |     await page.route('**/rest/v1/courses**', async (route) => {
  647 |       const method = route.request().method();
  648 |       if (method === 'GET') {
  649 |         await route.fulfill({
  650 |           status: 200,
  651 |           contentType: 'application/json',
  652 |           body: JSON.stringify(mockCourses)
  653 |         });
  654 |       } else if (method === 'POST') {
  655 |         const body = JSON.parse(route.request().postData() || '{}');
  656 |         const newC = {
  657 |           id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
  658 |           title: body.title,
  659 |           description: body.description,
  660 |           skills_taught: body.skills_taught,
  661 |           provider: body.provider,
  662 |           link: body.link,
  663 |           created_at: new Date().toISOString()
  664 |         };
  665 |         mockCourses.push(newC);
  666 |         await route.fulfill({
  667 |           status: 200,
  668 |           contentType: 'application/json',
  669 |           body: JSON.stringify(newC)
  670 |         });
  671 |       } else {
  672 |         await route.fulfill({
  673 |           status: 200,
  674 |           contentType: 'application/json',
  675 |           body: JSON.stringify({ success: true })
  676 |         });
  677 |       }
  678 |     });
  679 | 
  680 |     // Users list queries are now handled by the unified profiles router above
  681 | 
  682 |     // 1. Visit Landing Page and Navigate to Auth
  683 |     await page.goto('/');
  684 |     const getStartedBtn = page.locator('button#nav-btn-register');
  685 |     await getStartedBtn.click();
  686 | 
  687 |     // 2. Register a new user (who will have mock admin role via routing intercept)
  688 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  689 |     await toggleToSignUpBtn.click();
  690 | 
  691 |     const fullNameInput = page.locator('input#fullName');
  692 |     const emailInput = page.locator('input#email');
  693 |     const passwordInput = page.locator('input#password');
  694 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  695 | 
  696 |     const testEmail = `admin.${Date.now()}@edgetalent.com`;
  697 |     await fullNameInput.fill('Mock Administrator');
  698 |     await emailInput.fill(testEmail);
  699 |     await passwordInput.fill('supersecret123');
  700 |     await submitBtn.click();
  701 | 
  702 |     // 3. Verify redirected to Admin Dashboard and check welcome/stats
  703 |     const welcomeHeader = page.locator('h2', { hasText: 'Overview Management' });
> 704 |     await expect(welcomeHeader).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  705 | 
  706 |     const welcomeBody = page.locator('p', { hasText: 'As an administrator, you have complete read and write access' });
  707 |     await expect(welcomeBody).toBeVisible();
  708 | 
  709 |     // 4. Navigate to Users tab
  710 |     const usersTabBtn = page.locator('button', { hasText: 'Users List' });
  711 |     await usersTabBtn.click();
  712 |     const usersTitle = page.locator('h3', { hasText: 'Users Accounts Profiles' });
  713 |     await expect(usersTitle).toBeVisible();
  714 |     const developerRow = page.locator('td', { hasText: 'Alex Developer' });
  715 |     await expect(developerRow).toBeVisible();
  716 | 
  717 |     // 5. Navigate to Quizzes tab and add a quiz question
  718 |     const quizzesTabBtn = page.locator('button', { hasText: 'Quizzes' });
  719 |     await quizzesTabBtn.click();
  720 |     const quizzesTitle = page.locator('h3', { hasText: 'Assessment Quiz Questions' });
  721 |     await expect(quizzesTitle).toBeVisible();
  722 | 
  723 |     // Add quiz question
  724 |     const addQuestionBtn = page.locator('button', { hasText: 'Add Question' });
  725 |     await addQuestionBtn.click();
  726 | 
  727 |     await page.locator('textarea[placeholder*="handles state"]').fill('Which React hook is used to run side effects?');
  728 |     await page.locator('input[placeholder="Option A"]').fill('useEffect');
  729 |     await page.locator('input[placeholder="Option B"]').fill('useState');
  730 |     await page.locator('input[placeholder="Option C"]').fill('useContext');
  731 |     await page.locator('input[placeholder="Option D"]').fill('useReducer');
  732 |     await page.locator('select:has-text("-- Select Answer --")').selectOption('useEffect');
  733 | 
  734 |     await page.locator('button', { hasText: 'Create Question' }).click();
  735 | 
  736 |     // Verify question is added in frontend
  737 |     const newQuestion = page.locator('p', { hasText: 'Which React hook is used to run side effects?' });
  738 |     await expect(newQuestion).toBeVisible();
  739 | 
  740 |     // 6. Navigate to Courses tab and add a course
  741 |     const coursesTabBtn = page.locator('button', { hasText: 'Upskilling Hub' });
  742 |     await coursesTabBtn.click();
  743 |     const coursesTitle = page.locator('h3', { hasText: 'Upskilling Courses Catalog' });
  744 |     await expect(coursesTitle).toBeVisible();
  745 | 
  746 |     const addCourseBtn = page.locator('button', { hasText: 'Add Course' });
  747 |     await addCourseBtn.click();
  748 | 
  749 |     await page.locator('input[placeholder*="React & Node"]').fill('Tailwind CSS Mastery');
  750 |     await page.locator('textarea[placeholder*="Summarize course"]').fill('Learn utility-first styling patterns.');
  751 |     await page.locator('input[placeholder="React, TypeScript, Node.js"]').fill('TailwindCSS, CSS');
  752 |     await page.locator('input[placeholder*="Coursera"]').fill('Frontend Masters');
  753 |     await page.locator('input[placeholder*="example.com"]').fill('https://example.com/tailwind');
  754 | 
  755 |     await page.locator('button', { hasText: 'Create Course' }).click();
  756 | 
  757 |     // Verify course added
  758 |     const newCourse = page.locator('h4', { hasText: 'Tailwind CSS Mastery' });
  759 |     await expect(newCourse).toBeVisible();
  760 | 
  761 |     // 6.5 Navigate to Manage Funding tab and add a funding opportunity
  762 |     const fundingTabBtn = page.locator('button', { hasText: 'Manage Funding' });
  763 |     await fundingTabBtn.click();
  764 |     const fundingTitleHeader = page.locator('h3', { hasText: 'Funding Opportunities' });
  765 |     await expect(fundingTitleHeader).toBeVisible();
  766 | 
  767 |     const addFundingBtn = page.locator('button', { hasText: 'Add Funding Opportunity' });
  768 |     await addFundingBtn.click();
  769 | 
  770 |     await page.locator('input[placeholder*="Y Combinator W27"]').fill('Thiel Fellowship W27');
  771 |     await page.locator('form select').selectOption('Grants');
  772 |     await page.locator('input[placeholder*="Brief 1-sentence summary"]').fill('A fellowship program for young builders.');
  773 |     await page.locator('textarea[placeholder*="Detailed explanation"]').fill('Thiel Fellowship is a two-year program giving $100k.');
  774 |     await page.locator('input[placeholder*="$500,000"]').fill('$100,000');
  775 |     await page.locator('input[placeholder*="Tech startups"]').fill('Under 22 years old');
  776 |     await page.locator('input[placeholder*="September 15, 2026"]').fill('Rolling');
  777 |     await page.locator('input[placeholder*="example.com/apply"]').fill('https://www.thielfellowship.org/');
  778 | 
  779 |     await page.locator('button', { hasText: 'Create Opportunity' }).click();
  780 | 
  781 |     // Verify funding opportunity added
  782 |     const newFunding = page.locator('td', { hasText: 'Thiel Fellowship W27' });
  783 |     await expect(newFunding).toBeVisible();
  784 | 
  785 |     // 7. Logout
  786 |     const logoutBtn = page.locator('button', { hasText: 'Logout' });
  787 |     await logoutBtn.click();
  788 | 
  789 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  790 |     await expect(welcomeBackHeader).toBeVisible();
  791 |   });
  792 | });
  793 | 
  794 | 
```