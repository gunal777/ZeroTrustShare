import { test, expect } from "@playwright/test";
test("signup, uploads, navigation, sharing, preview, revocation, deletion and login", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/files");
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({
    path: "../.artifacts/login-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /Create an account/ }).click();
  await page.getByLabel("Your name").fill("Alex Morgan");
  const email = "browser-" + Date.now() + "@example.test";
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-password-123");
  await page.getByRole("button", { name: "Create your account" }).click();
  // Protected-route return path is preserved after signup.
  await expect(page).toHaveURL(/\/files$/);
  await page.locator("input[type=file]").setInputFiles({
    name: "project-brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Confidential project brief: the sharing workflow works.",
    ),
  });
  await expect(page.getByRole("listitem")).toContainText("project-brief.txt");
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back, Alex." }),
  ).toBeVisible();
  await page.screenshot({
    path: "../.artifacts/dashboard-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("link", { name: /My files/ }).click();
  await page.getByLabel("Search files").fill("missing");
  await expect(page.getByText("No files found.")).toBeVisible();
  await page.getByLabel("Search files").fill("");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download project-brief.txt", exact: true })
    .click();
  expect((await downloadPromise).suggestedFilename()).toBe("project-brief.txt");
  await page
    .getByRole("button", { name: "Share project-brief.txt", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Password optional").fill("link-password");
  await page.getByRole("button", { name: "Create share link" }).click();
  const url = await page
    .getByRole("dialog")
    .getByLabel("Share link", { exact: true })
    .inputValue();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("link", { name: /Shared links/ }).click();
  await page.reload();
  await expect(page.getByRole("article")).toContainText("project-brief.txt");
  const recipient = await browser.newContext();
  const publicPage = await recipient.newPage();
  await publicPage.goto(url);
  await publicPage.getByLabel("Share password").fill("wrong");
  await publicPage
    .getByRole("button", { name: "Download file", exact: true })
    .click();
  await expect(publicPage.getByRole("alert")).toContainText(
    "password is incorrect",
  );
  await publicPage.getByLabel("Share password").fill("link-password");
  await publicPage
    .getByRole("button", { name: "Preview file", exact: true })
    .click();
  await expect(publicPage.locator(".text-preview")).toContainText(
    "Confidential project brief",
  );
  await publicPage.screenshot({
    path: "../.artifacts/share-preview.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Revoke", exact: true }).click();
  await page.getByRole("button", { name: "Revoke access" }).click();
  await expect(page.getByRole("article")).toContainText("revoked");
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "This link has closed." }),
  ).toBeVisible();
  await recipient.close();
  await page.getByRole("link", { name: /My files/ }).click();
  await page
    .getByRole("button", { name: "Delete project-brief.txt", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep file", exact: true }).click();
  await expect(page.getByRole("listitem")).toBeVisible();
  await page
    .getByRole("button", { name: "Delete project-brief.txt", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete file", exact: true }).click();
  await expect(page.getByText("Room for your first file.")).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-password-123");
  await page.getByRole("button", { name: "Sign in to your vault" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back, Alex." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile navigation, dialog keyboard access, reduced motion and missing page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Mobile User");
  await page
    .getByLabel("Email address")
    .fill("mobile-" + Date.now() + "@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("mobile-password-123");
  await page.getByRole("button", { name: "Create your account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back, Mobile." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../.artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: /My files/ }).click();
  await expect(page).toHaveURL(/\/files$/);
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/page-that-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "This page wandered off." }),
  ).toBeVisible();
});

test("preview-only PDFs render pages without the browser plugin or a download action", async ({
  page,
}) => {
  const origin = "http://127.0.0.1:5101";
  await page.request.post("/api/auth/signup", {
    headers: { Origin: origin },
    data: {
      name: "PDF Reader",
      email: "pdf-" + Date.now() + "@example.test",
      password: "pdf-password-123",
    },
  });
  const stream = "BT /F1 24 Tf 40 180 Td (Private PDF preview) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 240] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 240] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  ];
  let source = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(source));
    source += index + 1 + " 0 obj\n" + object + "\nendobj\n";
  });
  const xref = Buffer.byteLength(source);
  source +=
    "xref\n0 7\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, "0") + " 00000 n \n")
      .join("") +
    "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" +
    xref +
    "\n%%EOF";
  const upload = await page.request.post("/api/files/upload", {
    headers: { Origin: origin },
    multipart: {
      file: {
        name: "private-preview.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(source),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const file = (await upload.json()).file;
  const link = await page.request.post("/api/share", {
    headers: { Origin: origin },
    data: { fileId: file._id, allowDownload: false },
  });
  expect(link.ok()).toBeTruthy();
  const token = (await link.json()).data.token;
  await page.goto("/share/" + token);
  await page.getByRole("button", { name: "Open preview" }).click();
  await expect(page.getByRole("img", { name: "PDF page 1" })).toHaveAttribute(
    "data-rendered",
    "true",
  );
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download file" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Next PDF page" }).click();
  await expect(page.getByRole("img", { name: "PDF page 2" })).toHaveAttribute(
    "data-rendered",
    "true",
  );
  await page.screenshot({
    path: "../.artifacts/pdf-preview.png",
    fullPage: true,
    animations: "disabled",
  });
});
