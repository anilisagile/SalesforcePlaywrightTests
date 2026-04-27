# Salesforce Account Automation – Project Setup Guide

A single-test [Playwright](https://playwright.dev) project that **automatically creates a new Account record** in any Salesforce org.

---

## Why Playwright for Salesforce Test Automation

**Playwright is an excellent choice for automating Salesforce tests, and one of its great advantages is built-in test script recording and code generation.** `<u>`**This means you don't have to write test code manually from scratch.**`</u>`

### Why This Matters

- **Record actions** as you interact with the browser normally
- **Auto-generate JavaScript test code** from your recordings
- **Prototype tests faster** without writing code by hand
- **Great for Salesforce Developers/QA Engineers** who want to build tests quickly

### This Sample Repository

This repository includes a **ready-to-use account creation test script** that you can:

- ✅ **Run immediately** to test your Salesforce org
- ✅ **Learn from** to understand Playwright test structure
- ✅ **Modify and extend** for your own testing scenarios

### Using the Code Generation Feature

If you want to record your own test scripts instead of writing them manually, refer to the [Recording commands](#recording-commands) section below for the `npx playwright codegen` commands.

---

## What the test does

| Step | Action                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| 1    | Opens a real Chromium browser (visible on screen)                                                             |
| 2    | Logs in to Salesforce with your credentials**or** a session URL                                         |
| 3    | Detects MFA / verification-code screens and**pauses** so you can enter the code                         |
| 4    | Navigates to the**Accounts** tab                                                                        |
| 5    | Clicks**New → Standard** and fills in a randomly-generated account name, phone, and US billing address |
| 6    | Saves the record and confirms it was created                                                                  |
| 7    | Shows a green success banner and takes a final screenshot                                                     |
| 8    | Generates a full**HTML report** with screenshots and a video recording                                  |

---

## Prerequisites

| Tool              | Minimum version | How to check |
| ----------------- | --------------- | ------------ |
| **Node.js** | 18 LTS          | `node -v`  |

> **Installing Node.js** – download the LTS installer from [https://nodejs.org](https://nodejs.org) and run it.
> After installation open a new terminal and verify with `node -v`.

---

## Configuring credentials (`.env` file)

Open `.env` in any text editor and choose **one** of the two login options.

### Option A – Username & Password (most common)

```env
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=your_username@example.com
SF_PASSWORD=YourPassword
SF_SESSION_URL=
SF_HOME_URL=
```

> For a **Sandbox** org use `SF_LOGIN_URL=https://test.salesforce.com`

### Option B – Session ID URL (skip the login page entirely)

1. Log in to Salesforce in your browser manually.
2. Copy the full URL from the address bar (it looks like `https://myorg.lightning.force.com/…`).
3. Paste it as `SF_SESSION_URL`:

```env
SF_SESSION_URL=https://myorg.lightning.force.com/lightning/page/home
SF_USERNAME=
SF_PASSWORD=
```

When `SF_SESSION_URL` is set, the username/password fields are ignored.

---

## Quick-start (fresh machine / after unzipping)

```bash
# 1. Enter the project folder
cd sf-account-automation

# 2. Install Node dependencies
npm install

# 3. Install Playwright + Chromium browser
npx playwright install chromium

# 4. Run the test
npm run testAccountSpec
```

An HTML report will open automatically in your browser when the test finishes.

---

## Handling the MFA / Verification-Code screen

Salesforce sometimes asks for an email verification code
The test **detects this automatically** and pauses:

```
════════════════════════════════════════════════════════════
VERIFICATION CODE REQUIRED – ACTION NEEDED IN BROWSER
════════════════════════════════════════════════════════════
1. Check your email/phone for the Salesforce verification code.
2. Type the code into the browser window that just opened.
3. Click the "Verify" button.
The test will wait up to 5 minutes…
════════════════════════════════════════════════════════════
```

1. Look at the Chromium browser window that opened on screen.
2. Check your email or phone, enter the 6-digit code, and click **Verify**.
3. The test detects the page change and continues automatically.

---

## Dependencies used

| Package                                     | Version | Purpose                                                 |
| ------------------------------------------- | ------- | ------------------------------------------------------- |
| [`@playwright/test`](https://playwright.dev) | ^1.44   | Test framework + Chromium browser driver                |
| `dotenv`                                  | ^16     | Load credentials from `.env` without hard-coding them |

> Playwright bundles its own **Chromium** browser – you do **not** need to install Chrome separately.
> The `npx playwright install chromium` command downloads the correct Chromium build for your OS.

---

## Running commands reference

| Command                             | What it does                                                    |
| ----------------------------------- | --------------------------------------------------------------- |
| `npm install`                     | Installs Node dependencies                                      |
| `npx playwright install chromium` | Downloads the Chromium browser                                  |
| `npm run testAccountSpec`         | Runs the account creation test                                  |
| `npm run test:report`             | Re-opens the HTML report                                        |
| `npx playwright codegen`          | Opens the Playwright Inspector to record and generate test code |
| `npx playwright codegen <URL>`    | Record tests for a specific URL                                 |

---

## Recording Commands (for generating test scripts)

If you'd like to **record your own test scripts** instead of writing them manually, use these commands:

### Record a Generic Test

```bash
npx playwright codegen
```

This opens the Playwright Inspector with a blank browser. You can then:

1. Navigate and interact with any website
2. Watch your actions generate as test code in real-time
3. Copy or save the generated JavaScript code

### Record Tests for Salesforce

```bash
npx playwright codegen https://login.salesforce.com
```

This launches the Inspector pointing to your Salesforce login URL. Great for:

- Recording login workflows
- Capturing custom Salesforce automation flows
- Learning Playwright syntax by example
- Quickly prototyping new test scenarios before adding them to your project

The generated code can then be copied into your test files and modified as needed!
