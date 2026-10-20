import { expect, test } from "@playwright/test";

test("image converter has a separate entry and exposes real format capabilities", async ({
  page,
}) => {
  test.setTimeout(60000);
  const wasmRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".wasm")) wasmRequests.push(request.url());
  });
  await page.goto("/tools/");
  await expect(
    page.locator('main a[href="/tools/image-convert/"]'),
  ).toBeVisible();
  expect(wasmRequests).toHaveLength(0);
  await page.locator('main a[href="/tools/image-convert/"]').click();
  await expect(
    page.getByRole("heading", { name: "图片格式转换", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("本地转换已就绪", { exact: true })).toBeVisible({
    timeout: 45000,
  });
  const formats = page.getByLabel("目标格式", { exact: true });
  for (const value of [
    "png",
    "jpeg",
    "webp",
    "avif",
    "gif",
    "bmp",
    "ico",
    "tiff",
    "jxl",
    "psd",
  ]) {
    await expect(formats.locator(`option[value="${value}"]`)).toHaveCount(1);
  }
  for (const value of ["heic", "heif", "svg"]) {
    await expect(formats.locator(`option[value="${value}"]`)).toHaveCount(0);
  }
  await page.getByText(/支持的格式/).click();
  await expect(page.locator(".conversion-formats")).toContainText("HEIC");
  await expect(page.locator(".conversion-formats")).toContainText("SVG");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  expect(wasmRequests).toHaveLength(1);
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    }, theme);
    await page.screenshot({
      path: `/tmp/blog-${test.info().project.name}-image-convert-${theme}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
});

test("offline format conversion keeps original dimensions and converts beyond browser-native formats", async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.goto("/tools/image-convert/");
  await expect(page.getByText("本地转换已就绪", { exact: true })).toBeVisible({
    timeout: 45000,
  });
  const image = async (width: number, height: number) =>
    page.evaluate(
      ([width, height]) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.fillStyle = "#3156e8";
        context.fillRect(width / 4, height / 4, width / 2, height / 2);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      [width, height],
    );
  const large = await image(2200, 1200);
  const small = await image(32, 16);
  await context.setOffline(true);
  const input = page.getByLabel("选择待转换图片", { exact: true });
  await input.setInputFiles({
    name: "原尺寸.png",
    mimeType: "image/png",
    buffer: Buffer.from(large, "base64"),
  });
  await page.getByRole("button", { name: "开始转换", exact: true }).click();
  const result = page.getByRole("article", { name: "原尺寸.png", exact: true });
  await expect(result.getByRole("link", { name: /下载/ })).toBeVisible({
    timeout: 20000,
  });
  const dimensions = await result
    .getByRole("link", { name: /下载/ })
    .evaluate(async (link: HTMLAnchorElement) => {
      const blob = await (await fetch(link.href)).blob();
      const data = new DataView(await blob.arrayBuffer());
      return {
        width: data.getUint32(16),
        height: data.getUint32(20),
        type: blob.type,
      };
    });
  expect(dimensions).toEqual({ width: 2200, height: 1200, type: "image/png" });
  await page.getByRole("button", { name: "清空图片", exact: true }).click();
  await input.setInputFiles({
    name: "透明图.png",
    mimeType: "image/png",
    buffer: Buffer.from(small, "base64"),
  });
  for (const [format, extension, mime] of [
    ["jpeg", "jpg", "image/jpeg"],
    ["webp", "webp", "image/webp"],
    ["tiff", "tiff", "image/tiff"],
    ["bmp", "bmp", "image/bmp"],
    ["ico", "ico", "image/x-icon"],
    ["avif", "avif", "image/avif"],
    ["jxl", "jxl", "image/jxl"],
  ]) {
    await page.getByLabel("目标格式", { exact: true }).selectOption(format);
    await page.getByRole("button", { name: "开始转换", exact: true }).click();
    const downloadLink = page.getByRole("link", {
      name: "下载 透明图.png",
      exact: true,
    });
    await expect(downloadLink).toBeVisible({ timeout: 15000 });
    await expect(downloadLink).toHaveAttribute(
      "download",
      `透明图-converted.${extension}`,
    );
    const actual = await downloadLink.evaluate(
      async (link: HTMLAnchorElement) => {
        const blob = await (await fetch(link.href)).blob();
        return { type: blob.type, size: blob.size };
      },
    );
    expect(actual.type).toBe(mime);
    expect(actual.size).toBeGreaterThan(0);
    const preview = page.locator(".image-preview img");
    await expect(preview).toBeVisible();
    await expect
      .poll(() =>
        preview.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  const download = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "下载 透明图.png", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("透明图-converted.jxl");
});

test("conversion validates input and preserves other files in the batch", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/tools/image-convert/");
  await expect(page.getByText("本地转换已就绪", { exact: true })).toBeVisible({
    timeout: 45000,
  });
  await page.getByLabel("选择待转换图片", { exact: true }).setInputFiles([
    {
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    },
    {
      name: "rectangle.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24"><rect width="48" height="24" fill="#3156e8"/></svg>',
      ),
    },
  ]);
  await page.getByRole("button", { name: "开始转换", exact: true }).click();
  await expect(
    page
      .getByRole("article", { name: "broken.png", exact: true })
      .locator(".tool-error"),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("link", { name: "下载 rectangle.svg", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "清空图片", exact: true }).click();
  await expect(page.locator(".image-result")).toHaveCount(0);
});

test("conversion can cancel and restart offline, including real HEIC and HEIF files", async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.goto("/tools/image-convert/");
  await expect(page.getByText("本地转换已就绪", { exact: true })).toBeVisible({
    timeout: 45000,
  });
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const pixels = context.createImageData(canvas.width, canvas.height);
    let seed = 12345;
    for (let index = 0; index < pixels.data.length; index += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[index] = seed & 255;
      pixels.data[index + 1] = (seed >>> 8) & 255;
      pixels.data[index + 2] = (seed >>> 16) & 255;
      pixels.data[index + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await context.setOffline(true);
  await page.getByLabel("目标格式", { exact: true }).selectOption("avif");
  await page.getByLabel("选择待转换图片", { exact: true }).setInputFiles({
    name: "noise.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await page.getByRole("button", { name: "开始转换", exact: true }).click();
  await page.getByRole("button", { name: "取消转换", exact: true }).click();
  await expect(page.getByText("已取消", { exact: true })).toBeVisible();
  await expect(page.getByText("本地转换已就绪", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "清空图片", exact: true }).click();
  await page.getByLabel("目标格式", { exact: true }).selectOption("png");
  await page
    .getByLabel("选择待转换图片", { exact: true })
    .setInputFiles([
      "tests/fixtures/images/conformance-window-padding.heic",
      "tests/fixtures/images/hevc32.heif",
    ]);
  await page.getByRole("button", { name: "开始转换", exact: true }).click();
  for (const [name, width] of [
    ["conformance-window-padding.heic", 1],
    ["hevc32.heif", 32],
  ] as const) {
    const result = page.getByRole("article", { name, exact: true });
    await expect(result.getByRole("link", { name: /下载/ })).toBeVisible({
      timeout: 15000,
    });
    const actualWidth = await result
      .getByRole("link", { name: /下载/ })
      .evaluate(async (link: HTMLAnchorElement) =>
        new DataView(await (await fetch(link.href)).arrayBuffer()).getUint32(
          16,
        ),
      );
    expect(actualWidth).toBe(width);
  }
  await expect(page.locator(".tool-error")).toHaveCount(0);
});
