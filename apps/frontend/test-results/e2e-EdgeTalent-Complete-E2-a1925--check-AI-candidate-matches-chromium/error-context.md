# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Partner Journey: register, onboard, post project and check AI candidate matches
- Location: test\e2e.spec.ts:115:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Select Partner Profile' })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - button "← Back to Home" [ref=e5] [cursor=pointer]
  - heading "Create Account" [level=2] [ref=e6]
  - paragraph [ref=e7]: Join the EdgeTalent ecosystem today
  - generic [ref=e8]: Failed to fetch
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]: Full Name
      - textbox "Full Name" [ref=e12]:
        - /placeholder: John Doe
        - text: Google DeepMind Partner
    - generic [ref=e13]:
      - generic [ref=e14]: Email Address
      - textbox "Email Address" [ref=e15]:
        - /placeholder: name@example.com
        - text: partner.1783680089569@edgetalent.com
    - generic [ref=e16]:
      - generic [ref=e17]: Password
      - textbox "Password" [ref=e18]:
        - /placeholder: ••••••••
        - text: supersecret123
    - button "Sign Up" [ref=e19] [cursor=pointer]
  - generic [ref=e20]:
    - text: Already have an account?
    - button "Log In" [ref=e21] [cursor=pointer]
```

# Test source

```ts
  38  | 
  39  |     // 4. Verify Dashboard Welcome message
  40  |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Alex Developer' });
  41  |     await expect(welcomeHeader).toBeVisible();
  42  | 
  43  |     // 5. Navigate to Profile Builder and update info
  44  |     const profileTabBtn = page.locator('button', { hasText: 'My Profile' });
  45  |     await profileTabBtn.click();
  46  | 
  47  |     const bioInput = page.locator('label:has-text("Biography Summary") + textarea');
  48  |     await bioInput.fill('Senior React engineer with a focus on high-performance SPAs.');
  49  |     const saveProfileBtn = page.locator('button', { hasText: 'Update Profile' });
  50  |     await saveProfileBtn.click();
  51  | 
  52  |     const successBadge = page.locator('.badge', { hasText: 'Profile updated successfully!' });
  53  |     await expect(successBadge).toBeVisible();
  54  | 
  55  |     // 6. Navigate to AI Skill-Gap Analyzer
  56  |     const analyzerTabBtn = page.locator('button', { hasText: 'AI Skill-Gap' });
  57  |     await analyzerTabBtn.click();
  58  | 
  59  |     const cvInput = page.locator('label:has-text("CV / Resume Text") + textarea');
  60  |     await cvInput.fill('Experience building apps with React, TypeScript, and standard HTML/CSS. Looking for opportunities.');
  61  |     const startAnalysisBtn = page.locator('button', { hasText: 'Start Analysis' });
  62  |     await startAnalysisBtn.click();
  63  | 
  64  |     // Verify AI analysis results render
  65  |     const resultsHeader = page.locator('h3', { hasText: 'Analyzer Results' });
  66  |     await expect(resultsHeader).toBeVisible();
  67  |     const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' });
  68  |     await expect(verifiedSkillBadge).toBeVisible();
  69  |     const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' });
  70  |     await expect(gapBadge).toBeVisible();
  71  | 
  72  |     // 7. Check Upskilling Hub (should list recommended courses based on gaps)
  73  |     const upskillingTabBtn = page.locator('button', { hasText: 'Upskilling' });
  74  |     await upskillingTabBtn.click();
  75  |     const coursesTitle = page.locator('h3', { hasText: 'Recommended Upskilling Paths' });
  76  |     await expect(coursesTitle).toBeVisible();
  77  |     const courseCard = page.locator('h4', { hasText: 'PostgreSQL & pgvector Deep Dive' });
  78  |     await expect(courseCard).toBeVisible();
  79  | 
  80  |     // 8. Go to Marketplace and apply for a project
  81  |     const marketplaceTabBtn = page.locator('button', { hasText: 'Marketplace' });
  82  |     await marketplaceTabBtn.click();
  83  | 
  84  |     const applyBtn = page.locator('button', { hasText: 'Apply' }).first();
  85  |     await expect(applyBtn).toBeVisible();
  86  |     await applyBtn.click();
  87  | 
  88  |     // Verify button state changes to "Applied"
  89  |     const appliedBtn = page.locator('button', { hasText: 'Applied' }).first();
  90  |     await expect(appliedBtn).toBeVisible();
  91  | 
  92  |     // 9. Go back to Overview and verify applications count and list
  93  |     const overviewTabBtn = page.locator('button', { hasText: 'Overview' });
  94  |     await overviewTabBtn.click();
  95  | 
  96  |     const activeAppBadge = page.locator('p', { hasText: '1 Active' });
  97  |     await expect(activeAppBadge).toBeVisible();
  98  |     const appItem = page.locator('h4', { hasText: 'EdgeTalent AI Matching Engine' });
  99  |     await expect(appItem).toBeVisible();
  100 | 
  101 |     // 10. Sign out and return home
  102 |     const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
  103 |     await signOutBtn.click();
  104 | 
  105 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  106 |     await expect(welcomeBackHeader).toBeVisible();
  107 | 
  108 |     const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
  109 |     await backToHomeBtn.click();
  110 | 
  111 |     const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
  112 |     await expect(landingBadge).toBeVisible();
  113 |   });
  114 | 
  115 |   test('Partner Journey: register, onboard, post project and check AI candidate matches', async ({ page }) => {
  116 |     // 1. Visit Landing Page and Navigate to Auth
  117 |     await page.goto('/');
  118 |     const getStartedBtn = page.locator('button.btn-primary', { hasText: 'Get Started' });
  119 |     await getStartedBtn.click();
  120 | 
  121 |     // 2. Register a new partner user
  122 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  123 |     await toggleToSignUpBtn.click();
  124 | 
  125 |     const fullNameInput = page.locator('input#fullName');
  126 |     const emailInput = page.locator('input#email');
  127 |     const passwordInput = page.locator('input#password');
  128 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  129 | 
  130 |     const testEmail = `partner.${Date.now()}@edgetalent.com`;
  131 |     await fullNameInput.fill('Google DeepMind Partner');
  132 |     await emailInput.fill(testEmail);
  133 |     await passwordInput.fill('supersecret123');
  134 |     await submitBtn.click();
  135 | 
  136 |     // 3. Complete Persona Onboarding as Partner
  137 |     const selectPartnerBtn = page.locator('button', { hasText: 'Select Partner Profile' });
> 138 |     await selectPartnerBtn.click();
      |                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  139 | 
  140 |     // 4. Verify Dashboard Header
  141 |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Google DeepMind Partner' });
  142 |     await expect(welcomeHeader).toBeVisible();
  143 | 
  144 |     // 5. Navigate to Project Manager Portal and post a new project
  145 |     const portalTabBtn = page.locator('button', { hasText: 'Post New Project' });
  146 |     await portalTabBtn.click();
  147 | 
  148 |     const projTitleInput = page.locator('label:has-text("Project Title") + input');
  149 |     const projDescInput = page.locator('label:has-text("Description & Scope") + textarea');
  150 |     const projSkillsInput = page.locator('label:has-text("Required Skills") + input');
  151 |     const projBudgetInput = page.locator('label:has-text("Budget") + input');
  152 |     const postProjBtn = page.locator('button[type="submit"]', { hasText: 'Post Project Scope' });
  153 | 
  154 |     await projTitleInput.fill('Next-Gen Quantum Compiler');
  155 |     await projDescInput.fill('Build a compiler pipeline using web assembly, typescript, and vector optimization models.');
  156 |     await projSkillsInput.fill('WebAssembly, TypeScript, Quantum Computing');
  157 |     await projBudgetInput.fill('5000');
  158 |     await postProjBtn.click();
  159 | 
  160 |     // Verify project posted successfully
  161 |     const successMsg = page.locator('.badge', { hasText: 'Project posted successfully with vector embeddings!' });
  162 |     await expect(successMsg).toBeVisible();
  163 | 
  164 |     // 6. Go to Partner Overview and verify the project shows up
  165 |     const overviewTabBtn = page.locator('button', { hasText: 'Projects Dashboard' });
  166 |     await overviewTabBtn.click();
  167 | 
  168 |     const postedProjectTitle = page.locator('h4', { hasText: 'Next-Gen Quantum Compiler' });
  169 |     await expect(postedProjectTitle).toBeVisible();
  170 | 
  171 |     // 7. Expand matches inline on the dashboard
  172 |     const findMatchesBtn = page.locator('button', { hasText: 'Find Talent Matches' }).first();
  173 |     await expect(findMatchesBtn).toBeVisible();
  174 |     await findMatchesBtn.click();
  175 | 
  176 |     // Verify candidate matches list is displayed
  177 |     const candidateName = page.locator('h6', { hasText: 'Mock AI Expert' });
  178 |     await expect(candidateName).toBeVisible();
  179 |     const contactBtn = page.locator('a', { hasText: 'Contact' });
  180 |     await expect(contactBtn).toBeVisible();
  181 |     await expect(contactBtn).toHaveAttribute('href', 'mailto:expert@edgetalent.com');
  182 | 
  183 |     // 8. Sign out and return home
  184 |     const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
  185 |     await signOutBtn.click();
  186 | 
  187 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  188 |     await expect(welcomeBackHeader).toBeVisible();
  189 | 
  190 |     const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
  191 |     await backToHomeBtn.click();
  192 | 
  193 |     const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
  194 |     await expect(landingBadge).toBeVisible();
  195 |   });
  196 | });
  197 | 
```