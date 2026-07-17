# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Partner Journey: register, onboard, post project and check AI candidate matches
- Location: test\e2e.spec.ts:449:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Select Partner Profile' })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - button "Back to Home" [ref=e5] [cursor=pointer]:
    - img [ref=e6]
    - text: Back to Home
  - heading "Create Account" [level=2] [ref=e8]
  - paragraph [ref=e9]: Join the EdgeTalent ecosystem today
  - generic [ref=e10]: Registration successful! Check your email or try logging in.
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]: Full Name
      - textbox "Full Name" [ref=e14]:
        - /placeholder: John Doe
        - text: Google DeepMind Partner
    - generic [ref=e15]:
      - generic [ref=e16]: Email Address
      - textbox "Email Address" [ref=e17]:
        - /placeholder: name@example.com
        - text: partner.1784315637311@edgetalent.com
    - generic [ref=e18]:
      - generic [ref=e19]: Password
      - textbox "Password" [ref=e20]:
        - /placeholder: ••••••••
        - text: supersecret123
    - button "Sign Up" [ref=e21] [cursor=pointer]
  - generic [ref=e22]:
    - text: Already have an account?
    - button "Log In" [ref=e23] [cursor=pointer]
```

# Test source

```ts
  372 |     await page.locator('#input-interest-goals').fill('Learn advanced backend and deployment strategies.');
  373 |     await page.locator('#btn-save-interests').click();
  374 | 
  375 |     // Submit Quiz & Interests
  376 |     const submitQuizBtn = page.locator('#btn-submit-quiz-interests');
  377 |     await expect(submitQuizBtn).toBeVisible();
  378 |     await submitQuizBtn.click();
  379 | 
  380 |     // Verify assessment results render
  381 |     const resultsHeader = page.locator('h3', { hasText: 'Assessment Results' });
  382 |     await expect(resultsHeader).toBeVisible();
  383 |     const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' }).first();
  384 |     await expect(verifiedSkillBadge).toBeVisible();
  385 |     const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' }).first();
  386 |     await expect(gapBadge).toBeVisible();
  387 | 
  388 |     // 7. Check Upskilling Hub (should list recommended courses based on gaps)
  389 |     const upskillingTabBtn = page.locator('button', { hasText: 'Upskilling' });
  390 |     await upskillingTabBtn.click();
  391 |     const coursesTitle = page.locator('h3', { hasText: 'Recommended Upskilling Paths' });
  392 |     await expect(coursesTitle).toBeVisible();
  393 |     const courseCard = page.locator('h4', { hasText: 'PostgreSQL & pgvector Deep Dive' });
  394 |     await expect(courseCard).toBeVisible();
  395 | 
  396 |     // 8. Go to Marketplace and apply for a project
  397 |     const marketplaceTabBtn = page.locator('button', { hasText: 'Marketplace' });
  398 |     await marketplaceTabBtn.click();
  399 | 
  400 |     const applyBtn = page.locator('button', { hasText: 'Apply' }).first();
  401 |     await expect(applyBtn).toBeVisible();
  402 |     await applyBtn.click();
  403 | 
  404 |     // Verify button state changes to "Applied"
  405 |     const appliedBtn = page.locator('button', { hasText: 'Applied' }).first();
  406 |     await expect(appliedBtn).toBeVisible();
  407 | 
  408 |     // 9. Go back to Overview and verify applications count and list
  409 |     const overviewTabBtn = page.locator('button', { hasText: 'Overview' });
  410 |     await overviewTabBtn.click();
  411 | 
  412 |     const activeAppBadge = page.locator('p', { hasText: '1 Active' });
  413 |     await expect(activeAppBadge).toBeVisible();
  414 |     const appItem = page.locator('h4', { hasText: 'EdgeTalent AI Matching Engine' });
  415 |     await expect(appItem).toBeVisible();
  416 | 
  417 |     // 9.5 Navigate to Funding Opportunities
  418 |     const fundingTabBtn = page.locator('button', { hasText: 'Funding Opportunities' }).first();
  419 |     await expect(fundingTabBtn).toBeVisible();
  420 |     await fundingTabBtn.click();
  421 | 
  422 |     // Verify funding opportunities are displayed
  423 |     const fundingHeader = page.locator('h3', { hasText: 'Funding & Grants Hub' });
  424 |     await expect(fundingHeader).toBeVisible();
  425 |     const fundingOpp = page.locator('h4', { hasText: 'Y Combinator W27 Funding Program' });
  426 |     await expect(fundingOpp).toBeVisible();
  427 | 
  428 |     // Open details
  429 |     await page.locator('button', { hasText: 'Read Details & Apply' }).first().click();
  430 |     const detailModalTitle = page.locator('h3', { hasText: 'Y Combinator W27 Funding Program' });
  431 |     await expect(detailModalTitle).toBeVisible();
  432 |     // Close modal
  433 |     await page.locator('#btn-close-funding-modal').click();
  434 | 
  435 |     // 10. Sign out and return home
  436 |     const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
  437 |     await signOutBtn.click();
  438 | 
  439 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  440 |     await expect(welcomeBackHeader).toBeVisible();
  441 | 
  442 |     const backToHomeBtn = page.locator('button', { hasText: 'Back to Home' });
  443 |     await backToHomeBtn.click();
  444 | 
  445 |     const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
  446 |     await expect(landingBadge).toBeVisible();
  447 |   });
  448 | 
  449 |   test('Partner Journey: register, onboard, post project and check AI candidate matches', async ({ page }) => {
  450 |     // 1. Visit Landing Page and Navigate to Auth
  451 |     await page.goto('/');
  452 |     const getStartedBtn = page.locator('button#nav-btn-register');
  453 |     await getStartedBtn.click();
  454 | 
  455 |     // 2. Register a new partner user
  456 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  457 |     await toggleToSignUpBtn.click();
  458 | 
  459 |     const fullNameInput = page.locator('input#fullName');
  460 |     const emailInput = page.locator('input#email');
  461 |     const passwordInput = page.locator('input#password');
  462 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  463 | 
  464 |     const testEmail = `partner.${Date.now()}@edgetalent.com`;
  465 |     await fullNameInput.fill('Google DeepMind Partner');
  466 |     await emailInput.fill(testEmail);
  467 |     await passwordInput.fill('supersecret123');
  468 |     await submitBtn.click();
  469 | 
  470 |     // 3. Complete Persona Onboarding as Partner
  471 |     const selectPartnerBtn = page.locator('button', { hasText: 'Select Partner Profile' });
> 472 |     await selectPartnerBtn.click();
      |                            ^ Error: locator.click: Test timeout of 60000ms exceeded.
  473 | 
  474 |     // 4. Verify Dashboard Header
  475 |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Google DeepMind Partner' });
  476 |     await expect(welcomeHeader).toBeVisible({ timeout: 15000 });
  477 | 
  478 |     // 5. Navigate to Manage Projects tab and open Post New Project modal
  479 |     const manageProjectsBtn = page.locator('button', { hasText: 'Manage Projects' });
  480 |     await manageProjectsBtn.click();
  481 | 
  482 |     const openPostModalBtn = page.locator('button', { hasText: '+ Post New Project' });
  483 |     await openPostModalBtn.click();
  484 | 
  485 |     const projTitleInput = page.locator('label:has-text("Project Title") + input');
  486 |     const projDescInput = page.locator('label:has-text("Description & Scope") + textarea');
  487 |     const projSkillsInput = page.locator('label:has-text("Required Skills") + input');
  488 |     const projBudgetInput = page.locator('label:has-text("Budget") + input');
  489 |     const postProjBtn = page.locator('button[type="submit"]', { hasText: 'Post Project Scope' });
  490 | 
  491 |     await projTitleInput.fill('Next-Gen Quantum Compiler');
  492 |     await projDescInput.fill('Build a compiler pipeline using web assembly, typescript, and vector optimization models.');
  493 |     await projSkillsInput.fill('WebAssembly, TypeScript, Quantum Computing');
  494 |     await projBudgetInput.fill('5000');
  495 |     await postProjBtn.click();
  496 | 
  497 |     // Verify project posted successfully in modal
  498 |     const successMsg = page.locator('.badge', { hasText: 'Project posted successfully with vector embeddings!' });
  499 |     await expect(successMsg).toBeVisible();
  500 | 
  501 |     // Verify the project shows up on the Manage Projects list (modal auto-closes)
  502 |     const postedProjectTitle = page.locator('h4', { hasText: 'Next-Gen Quantum Compiler' });
  503 |     await expect(postedProjectTitle).toBeVisible();
  504 | 
  505 |     // 6. Go back to Dashboard and verify the project shows up under Recent Project Postings
  506 |     const dashboardTabBtn = page.locator('button', { hasText: 'Dashboard' });
  507 |     await dashboardTabBtn.click();
  508 |     const recentProjectTitle = page.locator('h4', { hasText: 'Next-Gen Quantum Compiler' }).first();
  509 |     await expect(recentProjectTitle).toBeVisible();
  510 | 
  511 |     // 7. Go back to Manage Projects to expand matches inline
  512 |     await manageProjectsBtn.click();
  513 |     const findMatchesBtn = page.locator('button', { hasText: 'Find Talent Matches' }).first();
  514 |     await expect(findMatchesBtn).toBeVisible();
  515 |     await findMatchesBtn.click();
  516 | 
  517 |     // Verify candidate matches list is displayed
  518 |     const candidateName = page.locator('h6', { hasText: 'Mock AI Expert' });
  519 |     await expect(candidateName).toBeVisible();
  520 |     const contactBtn = page.locator('a', { hasText: 'Contact' });
  521 |     await expect(contactBtn).toBeVisible();
  522 |     await expect(contactBtn).toHaveAttribute('href', 'mailto:expert@edgetalent.com');
  523 | 
  524 |     // 8. Navigate to Entrepreneurship Academy
  525 |     const coursesTabBtn = page.locator('button', { hasText: 'Entrepreneurship Academy' });
  526 |     await expect(coursesTabBtn).toBeVisible();
  527 |     await coursesTabBtn.click();
  528 | 
  529 |     // Verify training courses are displayed
  530 |     const academyHeader = page.locator('h3', { hasText: 'Entrepreneurship & Business Training' });
  531 |     await expect(academyHeader).toBeVisible();
  532 |     const courseItem = page.locator('h4', { hasText: 'Startup School: How to Start a Startup' });
  533 |     await expect(courseItem).toBeVisible();
  534 | 
  535 |     // 8.5 Navigate to Funding Opportunities
  536 |     const fundingTabBtn = page.locator('button', { hasText: 'Funding Opportunities' }).first();
  537 |     await expect(fundingTabBtn).toBeVisible();
  538 |     await fundingTabBtn.click();
  539 | 
  540 |     // Verify funding opportunities are displayed
  541 |     const fundingHeader = page.locator('h3', { hasText: 'Funding & Grants Hub' });
  542 |     await expect(fundingHeader).toBeVisible();
  543 |     const fundingOpp = page.locator('h4', { hasText: 'Y Combinator W27 Funding Program' });
  544 |     await expect(fundingOpp).toBeVisible();
  545 | 
  546 |     // Open details
  547 |     await page.locator('button', { hasText: 'Read Details & Apply' }).first().click();
  548 |     const detailModalTitle = page.locator('h3', { hasText: 'Y Combinator W27 Funding Program' });
  549 |     await expect(detailModalTitle).toBeVisible();
  550 |     // Close modal
  551 |     await page.locator('#btn-close-funding-modal').click();
  552 | 
  553 |     // 8.6 Navigate to Hiring Desk and check applications
  554 |     const hiringTabBtn = page.locator('button', { hasText: 'Hiring Desk' });
  555 |     await expect(hiringTabBtn).toBeVisible();
  556 |     await hiringTabBtn.click();
  557 | 
  558 |     // Verify Hiring Desk header
  559 |     const hiringHeader = page.locator('h3', { hasText: 'Hiring Desk' });
  560 |     await expect(hiringHeader).toBeVisible();
  561 | 
  562 |     // Verify candidate details are displayed
  563 |     const candidateNameText = page.locator('h4', { hasText: 'Mock Talent Candidate' });
  564 |     await expect(candidateNameText).toBeVisible();
  565 | 
  566 |     // Perform status update (click Shortlist)
  567 |     const shortlistBtn = page.locator('button.btn-shortlist').first();
  568 |     await expect(shortlistBtn).toBeVisible();
  569 |     await shortlistBtn.click();
  570 | 
  571 |     // Verify status badge update
  572 |     const statusBadge = page.locator('span.badge', { hasText: 'shortlisted' }).first();
```