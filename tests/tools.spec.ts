import { expect, test } from "@playwright/test";

test("projects show all three real repositories and downloads", async ({
  page,
}) => {
  await page.goto("/projects/");
  await expect(
    page.getByRole("heading", { name: "项目", exact: true }),
  ).toBeVisible();
  for (const name of ["sonahop", "ssr2clash", "glimtray"]) {
    await expect(
      page.locator(`main a[href="https://github.com/redpandaex/${name}"]`),
    ).toBeVisible();
    await expect(
      page.locator(
        `main a[href="https://github.com/redpandaex/${name}/releases"]`,
      ),
    ).toBeVisible();
  }
});

test("tools and all five navigation destinations are accessible", async ({
  page,
}) => {
  await page.goto("/tools/");
  await expect(
    page.getByRole("heading", { name: "工具", exact: true }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "主导航" });
  for (const label of ["首页", "文章", "项目", "工具", "关于"]) {
    await expect(
      navigation.getByRole("link", { name: new RegExp(label) }),
    ).toBeVisible();
  }
  await expect(page.locator('main a[href="/tools/text-diff/"]')).toBeVisible();
  await expect(
    page.locator('main a[href="/tools/image-compress/"]'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
});

test("local diff handles Chinese changes and discards stale output", async ({
  page,
  context,
}) => {
  await page.goto("/tools/text-diff/");
  await expect(page.getByText("本地引擎已就绪", { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page
    .getByLabel("原始文本", { exact: true })
    .fill("第一行\n旧内容\n结尾");
  await page
    .getByLabel("修改后文本", { exact: true })
    .fill("第一行\n新内容\n结尾");
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await expect(page.locator('[data-diff="removed"]')).toContainText("旧内容");
  await expect(page.locator('[data-diff="added"]')).toContainText("新内容");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "下载差异", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.txt$/);
  await page
    .getByLabel("修改后文本", { exact: true })
    .fill("第一行\n旧内容\n结尾");
  await expect(page.locator('[data-diff="removed"]')).toHaveCount(0);
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await expect(page.getByText("两段文本一致", { exact: true })).toBeVisible();
});

test("diff imports UTF-8, normalizes CRLF and compares against empty text", async ({
  page,
}) => {
  await page.goto("/tools/text-diff/");
  await page.getByLabel("导入原始文本", { exact: true }).setInputFiles({
    name: "before.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("你好\r\n世界\r\n"),
  });
  await page.getByLabel("修改后文本", { exact: true }).fill("你好\n世界\n");
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await expect(page.getByText("两段文本一致", { exact: true })).toBeVisible();
  await page.getByLabel("原始文本", { exact: true }).fill("");
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await expect(page.locator('[data-diff="added"]')).toContainText([
    "你好",
    "世界",
  ]);
});

test("diff rejects oversized file imports before placing them in the editor", async ({
  page,
}) => {
  await page.goto("/tools/text-diff/");
  await page.getByLabel("导入原始文本", { exact: true }).setInputFiles({
    name: "large.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("行\n".repeat(30001)),
  });
  await expect(page.locator("main").getByRole("alert")).toContainText("30,000");
  await expect(page.getByLabel("原始文本", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "清空文本", exact: true }).click();
  await expect(page.getByLabel("原始文本", { exact: true })).toHaveValue("");
});

test("large diff previews stay bounded while the full export stays available", async ({
  page,
}) => {
  await page.goto("/tools/text-diff/");
  const text = Array.from({ length: 650 }, (_, index) => `行 ${index}`).join(
    "\n",
  );
  await page.getByLabel("原始文本", { exact: true }).fill(text);
  await page
    .getByLabel("修改后文本", { exact: true })
    .fill(text.replace("行 300", "中间有修改"));
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await expect(page.locator(".diff-line")).toHaveCount(500);
  await expect(page.getByText(/预览前 500 行/)).toBeVisible();
  await page.getByLabel("只看差异", { exact: true }).check();
  await expect(page.locator(".diff-line")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "下载差异", exact: true }),
  ).toBeVisible();
});

test("cancelled comparisons can be replaced while offline", async ({
  page,
  context,
}) => {
  await page.goto("/tools/text-diff/");
  await expect(page.getByText("本地引擎已就绪", { exact: true })).toBeVisible();
  for (const [label, value] of [
    ["导入原始文本", "a\n".repeat(4000)],
    ["导入修改后文本", "b\n".repeat(4000)],
  ]) {
    await page.getByLabel(label, { exact: true }).setInputFiles({
      name: "text.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(value),
    });
  }
  await expect
    .poll(() =>
      page
        .getByLabel("修改后文本", { exact: true })
        .inputValue()
        .then((value) => value.length),
    )
    .toBe(8000);
  await context.setOffline(true);
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await page.getByRole("button", { name: "取消对比", exact: true }).click();
  await expect(page.getByText("本地引擎已就绪", { exact: true })).toBeVisible();
  await page.getByLabel("原始文本", { exact: true }).fill("重新对比");
  await page.getByLabel("修改后文本", { exact: true }).fill("重新对比");
  await page.getByRole("button", { name: "开始对比", exact: true }).click();
  await expect(page.getByText("两段文本一致", { exact: true })).toBeVisible();
});

test("image conversion works offline, resizes, preserves alpha and downloads", async ({
  page,
  context,
}) => {
  await page.goto("/tools/image-compress/");
  await expect(page.getByText(/^本地处理已就绪/)).toBeVisible();
  const source = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 1000;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#3156e8";
    context.fillRect(100, 100, 1800, 800);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await context.setOffline(true);
  await page.getByLabel("选择图片", { exact: true }).setInputFiles({
    name: "透明图片.png",
    mimeType: "image/png",
    buffer: Buffer.from(source, "base64"),
  });
  await page.getByLabel("最大边长", { exact: true }).selectOption("1280");
  await page.getByRole("button", { name: "开始压缩", exact: true }).click();
  const downloadLink = page.getByRole("link", {
    name: "下载 透明图片.png",
    exact: true,
  });
  await expect(downloadLink).toBeVisible();
  const measure = () =>
    page
      .locator(".image-preview img")
      .evaluate(async (image: HTMLImageElement) => {
        const blob = await (await fetch(image.src)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(bitmap, 0, 0);
        const pixel = Array.from(context.getImageData(0, 0, 1, 1).data);
        bitmap.close();
        return {
          width: canvas.width,
          height: canvas.height,
          mime: blob.type,
          pixel,
        };
      });
  expect(await measure()).toEqual({
    width: 1280,
    height: 640,
    mime: "image/webp",
    pixel: [0, 0, 0, 0],
  });
  const download = page.waitForEvent("download");
  await downloadLink.click();
  expect((await download).suggestedFilename()).toMatch(/\.webp$/);
  await page.getByLabel("输出格式", { exact: true }).selectOption("image/jpeg");
  await expect(downloadLink).toHaveCount(0);
  await page.getByRole("button", { name: "开始压缩", exact: true }).click();
  await expect(downloadLink).toBeVisible();
  expect(await measure()).toEqual({
    width: 1280,
    height: 640,
    mime: "image/jpeg",
    pixel: [255, 255, 255, 255],
  });
  await page.getByLabel("输出格式", { exact: true }).selectOption("image/png");
  await expect(page.getByRole("slider", { name: /压缩质量/ })).toBeDisabled();
  await page.getByRole("button", { name: "开始压缩", exact: true }).click();
  await expect(downloadLink).toBeVisible();
  expect(await measure()).toEqual({
    width: 1280,
    height: 640,
    mime: "image/png",
    pixel: [0, 0, 0, 0],
  });
  await page.getByRole("button", { name: "清空图片", exact: true }).click();
  await expect(page.locator(".image-result")).toHaveCount(0);
});

test("image batch isolates corrupt files from successful files", async ({
  page,
}) => {
  await page.goto("/tools/image-compress/");
  await page.getByLabel("选择图片", { exact: true }).setInputFiles([
    {
      name: "bad.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    },
    {
      name: "tiny.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    },
  ]);
  await page.getByRole("button", { name: "开始压缩", exact: true }).click();
  await expect(
    page
      .getByRole("article", { name: "bad.png", exact: true })
      .locator(".tool-error"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "下载 tiny.png", exact: true }),
  ).toBeVisible();
});

test("manual motion settings are ignored and public email stays hidden", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("ui-motion", "off"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const route of ["/", "/about/", "/projects/", "/tools/"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
    await expect(page.locator(".motion-toggle")).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(
      /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
});

test("new pages fit both themes and mobile page transitions keep the viewport stable", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
  for (const label of ["工具", "项目", "关于"]) {
    await page
      .getByRole("navigation", { name: "主导航" })
      .getByRole("link", { name: new RegExp(label) })
      .click();
    await expect(page).toHaveURL(
      label === "工具"
        ? /\/tools\/$/
        : label === "项目"
          ? /\/projects\/$/
          : /\/about\/$/,
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      )
      .toBe(true);
  }
  for (const route of [
    "projects",
    "tools",
    "tools/text-diff",
    "tools/image-compress",
  ]) {
    await page.goto(`/${route}/`);
    for (const dark of [false, true]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/blog-${testInfo.project.name}-${route.replaceAll("/", "-")}-${dark ? "dark" : "light"}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  expect(errors).toEqual([]);
});
