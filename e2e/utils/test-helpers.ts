import { Page } from '@playwright/test';

// Test data generators
export function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test.${timestamp}@example.com`;
}

export function generateTestUsername(): string {
  const timestamp = Date.now();
  return `testuser_${timestamp}`;
}

export function generateTestBusinessName(): string {
  const timestamp = Date.now();
  return `Test Business ${timestamp}`;
}

// Navigation helpers
interface NavigationHelpers {
  goHome(): Promise<void>;
  goToBusinesses(): Promise<void>;
  goToEvents(): Promise<void>;
  goToNews(): Promise<void>;
  goToJobs(): Promise<void>;
  goToMarketplace(): Promise<void>;
  goToAuth(): Promise<void>;
  goToAdmin(): Promise<void>;
}

// Wait helpers
interface WaitHelpers {
  waitForLoadingComplete(): Promise<void>;
  waitForElement(selector: string, timeout?: number): Promise<void>;
  waitForText(text: string, timeout?: number): Promise<void>;
}

// Validation helpers
interface ValidationHelpers {
  verifyPageTitle(expectedTitle: string): Promise<void>;
  verifyPageUrl(expectedUrl: string): Promise<void>;
  verifyElementExists(selector: string): Promise<boolean>;
  verifyTextExists(text: string): Promise<boolean>;
}

// Error helpers
interface ErrorHelpers {
  checkForErrorMessages(): Promise<string[]>;
  waitForNoErrors(timeout?: number): Promise<void>;
  captureErrorState(): Promise<void>;
}

// Form helpers
interface FormHelpers {
  fillForm(formData: Record<string, string>): Promise<void>;
  submitForm(formSelector?: string): Promise<void>;
  clearForm(formSelector?: string): Promise<void>;
  selectOption(selectSelector: string, value: string): Promise<void>;
}

// Auth helpers
interface AuthHelpers {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signup(email: string, password: string, username?: string): Promise<void>;
  isLoggedIn(): Promise<boolean>;
}

// Main helpers interface
export interface TestHelpers {
  nav: NavigationHelpers;
  wait: WaitHelpers;
  validate: ValidationHelpers;
  error: ErrorHelpers;
  form: FormHelpers;
  auth: AuthHelpers;
}

// Implementation
export function createHelpers(page: Page): TestHelpers {
  const nav: NavigationHelpers = {
    async goHome() {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    },

    async goToBusinesses() {
      await page.goto('/businesses');
      await page.waitForLoadState('networkidle');
    },

    async goToEvents() {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
    },

    async goToNews() {
      await page.goto('/news');
      await page.waitForLoadState('networkidle');
    },

    async goToJobs() {
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
    },

    async goToMarketplace() {
      await page.goto('/marketplace');
      await page.waitForLoadState('networkidle');
    },

    async goToAuth() {
      await page.goto('/auth-test');
      await page.waitForLoadState('networkidle');
    },

    async goToAdmin() {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
    }
  };

  const wait: WaitHelpers = {
    async waitForLoadingComplete() {
      // Wait for network to be idle
      await page.waitForLoadState('networkidle');
      
      // Wait for any loading indicators to disappear
      try {
        await page.waitForSelector('[data-loading="true"], .loading, .spinner', { 
          state: 'hidden', 
          timeout: 5000 
        });
      } catch {
        // Loading indicators might not exist, which is fine
      }
      
      // Give a small buffer for any remaining animations
      await page.waitForTimeout(500);
    },

    async waitForElement(selector: string, timeout = 10000) {
      await page.waitForSelector(selector, { timeout });
    },

    async waitForText(text: string, timeout = 10000) {
      await page.waitForSelector(`text="${text}"`, { timeout });
    }
  };

  const validate: ValidationHelpers = {
    async verifyPageTitle(expectedTitle: string) {
      const title = await page.title();
      if (!title.includes(expectedTitle)) {
        throw new Error(`Expected title to contain "${expectedTitle}", but got "${title}"`);
      }
    },

    async verifyPageUrl(expectedUrl: string) {
      const currentUrl = page.url();
      if (!currentUrl.includes(expectedUrl)) {
        throw new Error(`Expected URL to contain "${expectedUrl}", but got "${currentUrl}"`);
      }
    },

    async verifyElementExists(selector: string): Promise<boolean> {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    },

    async verifyTextExists(text: string): Promise<boolean> {
      try {
        await page.waitForSelector(`text="${text}"`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  };

  const error: ErrorHelpers = {
    async checkForErrorMessages(): Promise<string[]> {
      const errorSelectors = [
        '.error',
        '.alert-error',
        '.error-message',
        '[role="alert"]',
        '.toast-error',
        '.notification-error'
      ];

      const errors: string[] = [];
      
      for (const selector of errorSelectors) {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            const text = await element.textContent();
            if (text && text.trim()) {
              errors.push(text.trim());
            }
          }
        }
      }

      return errors;
    },

    async waitForNoErrors(timeout = 5000) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const errors = await this.checkForErrorMessages();
        if (errors.length === 0) {
          return;
        }
        await page.waitForTimeout(500);
      }
      
      const remainingErrors = await this.checkForErrorMessages();
      if (remainingErrors.length > 0) {
        throw new Error(`Errors still present after ${timeout}ms: ${remainingErrors.join(', ')}`);
      }
    },

    async captureErrorState() {
      const errors = await this.checkForErrorMessages();
      if (errors.length > 0) {
        console.log('Error state captured:', errors);
        await page.screenshot({ path: `error-state-${Date.now()}.png` });
      }
    }
  };

  const form: FormHelpers = {
    async fillForm(formData: Record<string, string>) {
      for (const [field, value] of Object.entries(formData)) {
        // Try multiple possible selectors for the field
        const selectors = [
          `input[name="${field}"]`,
          `input[id="${field}"]`,
          `textarea[name="${field}"]`,
          `textarea[id="${field}"]`,
          `select[name="${field}"]`,
          `select[id="${field}"]`,
          `[data-testid="${field}"]`
        ];

        let filled = false;
        for (const selector of selectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              await element.fill(value);
              filled = true;
              break;
            }
          } catch {
            // Try next selector
          }
        }

        if (!filled) {
          console.warn(`Could not fill field: ${field}`);
        }
      }
    },

    async submitForm(formSelector = 'form') {
      const submitButton = page.locator(`${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      } else {
        // Fallback: press Enter
        await page.keyboard.press('Enter');
      }
    },

    async clearForm(formSelector = 'form') {
      const inputs = await page.locator(`${formSelector} input, ${formSelector} textarea`).all();
      for (const input of inputs) {
        if (await input.isVisible()) {
          await input.clear();
        }
      }
    },

    async selectOption(selectSelector: string, value: string) {
      await page.selectOption(selectSelector, value);
    }
  };

  const auth: AuthHelpers = {
    async login(email: string, password: string) {
      await nav.goToAuth();
      await wait.waitForLoadingComplete();

      // Try to find login form
      await form.fillForm({
        email: email,
        password: password
      });

      await form.submitForm();
      await wait.waitForLoadingComplete();
    },

    async logout() {
      // Look for logout button or link
      const logoutSelectors = [
        'button:has-text("Logout")',
        'a:has-text("Logout")',
        'button:has-text("Sign Out")',
        'a:has-text("Sign Out")',
        '[data-testid="logout"]'
      ];

      for (const selector of logoutSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.isVisible()) {
            await element.click();
            await wait.waitForLoadingComplete();
            return;
          }
        } catch {
          // Try next selector
        }
      }

      console.warn('Could not find logout button');
    },

    async signup(email: string, password: string, username?: string) {
      await nav.goToAuth();
      await wait.waitForLoadingComplete();

      const formData: Record<string, string> = {
        email: email,
        password: password
      };

      if (username) {
        formData.username = username;
      }

      await form.fillForm(formData);
      await form.submitForm();
      await wait.waitForLoadingComplete();
    },

    async isLoggedIn(): Promise<boolean> {
      // Check for indicators of logged-in state
      const loggedInSelectors = [
        'button:has-text("Logout")',
        'a:has-text("Logout")',
        '[data-testid="user-menu"]',
        '.user-profile',
        '.logged-in'
      ];

      for (const selector of loggedInSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.isVisible()) {
            return true;
          }
        } catch {
          // Continue checking
        }
      }

      return false;
    }
  };

  return {
    nav,
    wait,
    validate,
    error,
    form,
    auth
  };
}