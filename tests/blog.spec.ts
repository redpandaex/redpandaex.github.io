import { expect, test } from "@playwright/test";

test("homepage shows real articles and responds to artwork controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Code. Create." }),
  ).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(2);
  await expect(page.locator(".panda-image")).toBeVisible();
  expect(
    await page
      .locator(".panda-image")
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBe(true);
  await page.getByRole("button", { name: "切换画布配色" }).click();
  await expect(page.locator(".hero-stage")).toHaveClass(/palette-1/);
  await page.getByRole("button", { name: "重置画布配色" }).click();
  await expect(page.locator(".hero-stage")).toHaveClass(/palette-0/);
  expect(errors).toEqual([]);
});

test("keyboard search opens, filters, navigates and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "搜索文章", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("searchbox", { name: "搜索文章", exact: true })
    .fill("不存在的文章");
  await expect(page.getByText("还没有这个主题的文章")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "搜索文章", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Control+k");
  await page
    .getByRole("searchbox", { name: "搜索文章", exact: true })
    .fill("qiankun");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/qiankun-micro-frontend-guide/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("article search and tag filtering use published content", async ({
  page,
}) => {
  await page.goto("/blog/");
  await expect(page.locator(".post-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Next.js", exact: true }).click();
  await expect(page.locator(".post-card")).toHaveCount(1);
  await page
    .getByRole("searchbox", { name: "搜索文章列表" })
    .fill("no-such-post");
  await expect(page.getByText("这个组合还没有文章")).toBeVisible();
  await page.getByRole("button", { name: "重置筛选" }).click();
  await expect(page.locator(".post-card")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "文章排序" })
    .selectOption("reading");
  await expect(page.locator(".post-card").first()).toContainText("Next.js 15");
});

test("theme persists across routes and reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/blog/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "切换浅色模式" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("reading tools follow headings, adjust text and copy actual code", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blog/nextjs-15-react-19-deep-dive/");
  await expect(page.locator(".article-toc a").first()).toBeVisible();
  const link = page.locator(".article-toc a").first();
  const target = await link.getAttribute("href");
  await link.click();
  await expect(page).toHaveURL(
    (url) => decodeURIComponent(url.hash) === target,
  );
  await page.getByRole("button", { name: "放大字号" }).click();
  await expect(page.locator(".article-prose")).toHaveClass(/reading-large/);
  await expect(page.getByRole("button", { name: "放大字号" })).toBeDisabled();
  const code = await page.locator(".code-block pre").first().textContent();
  await page.getByRole("button", { name: "复制代码" }).first().click();
  await expect(
    page.getByRole("button", { name: "复制代码" }).first(),
  ).toHaveText("已复制");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    code?.replace(/\n$/, ""),
  );
});

test("canvas controls work and respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/");
  await expect(
    page.getByText("已按系统偏好关闭自动动画", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "播放实验" })).toBeDisabled();
  await page.getByRole("button", { name: "弹性网格" }).click();
  await expect(page.getByRole("button", { name: "弹性网格" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("slider", { name: "互动强度" }).fill("30");
  await expect(page.locator("output")).toHaveText("30%");
  await page.getByRole("button", { name: "重置实验参数" }).click();
  await expect(page.locator("output")).toHaveText("70%");
  await expect(page.getByRole("button", { name: "粒子引力" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("all main routes and both themes fit the viewport", async ({ page }) => {
  for (const route of [
    "/",
    "/blog/",
    "/categories/",
    "/tags/",
    "/about/",
    "/projects/",
    "/test-fluid/",
    "/tags/next.js/",
    "/categories/frontend/",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    for (const dark of [false, true]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `horizontal overflow: ${route} dark=${dark}`,
      ).toBe(true);
    }
  }
});

test("fluid simulation is opt-in, can be cleared and stopped", async ({
  page,
}) => {
  await page.goto("/test-fluid/");
  const start = page.getByRole("button", { name: "开始创作" });
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.locator(".fluid-stage canvas")).toBeVisible();
  await page.getByRole("button", { name: "清空画布" }).click();
  await expect(page.locator(".fluid-stage canvas")).toBeVisible();
  await page.getByRole("button", { name: "暂停并退出画布" }).click();
  await expect(page.locator(".fluid-stage canvas")).toHaveCount(0);
  await expect(start).toBeVisible();
});

test("main navigation exposes current route and supports mobile menu", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "打开主菜单" }).click();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await page
      .locator("#mobile-navigation")
      .getByRole("link", { name: "博客", exact: true })
      .click();
    await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  } else {
    await page
      .locator(".desktop-nav")
      .getByRole("link", { name: "博客", exact: true })
      .click();
    await expect(
      page
        .locator(".desktop-nav")
        .getByRole("link", { name: "博客", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  await expect(page).toHaveURL(/\/blog\/$/);
});
