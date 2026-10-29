import { expect, type Page, test } from "@playwright/test";

async function clickHomeTitle(page: Page) {
  await page.getByRole("button", { name: "点击标题，让字母掉下来" }).click({
    position: { x: 40, y: 60 },
  });
}

for (const surface of [
  { name: "preview", route: "/playground/text/" },
  { name: "homepage", route: "/" },
]) {
  test.describe(surface.name, () => {
    const stage = (page: Page) => page.getByTestId("text-stage");
    const pieces = (page: Page) => stage(page).locator("[data-kinetic-piece]");
    async function enableDarkMode(page: Page) {
      if (surface.name === "preview") {
        await page
          .locator("main")
          .getByRole("button", { name: "切换到深色主题" })
          .click();
        return;
      }
      const tools = page.getByRole("button", { name: "打开快捷工具" });
      const compact = await tools.isVisible();
      if (compact) await tools.click();
      await page.getByRole("button", { name: "切换深色模式" }).click();
      if (compact)
        await page.getByRole("button", { name: "关闭快捷工具" }).click();
    }

    async function openPlayground(page: Page) {
      await page.goto(surface.route);
      await expect(
        page.getByRole("heading", {
          name: surface.name === "preview" ? "文字游乐场" : "Code. Create.",
          level: 1,
        }),
      ).toBeVisible();
      await expect(stage(page)).toHaveAttribute("data-paused", "false");
      if (surface.name === "homepage") {
        await expect(
          page.getByRole("button", { name: "碰一下", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "重新排好", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByText("移动鼠标拨动文字，点一下，让字母掉下来。", {
            exact: true,
          }),
        ).toHaveCount(0);
      }
    }

    async function drop(page: Page) {
      if (surface.name === "homepage") {
        await clickHomeTitle(page);
      } else {
        const action = page.getByRole("button", {
          name: "碰一下",
          exact: true,
        });
        // Scroll deliberately before tapping, clear of the fixed mobile dock.
        await action.evaluate((button) =>
          button.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        await action.click();
      }
      await expect(stage(page)).toHaveAttribute("data-phase", "falling");
      await expect(pieces(page)).toHaveCount(12);
    }

    async function restore(page: Page) {
      if (surface.name === "homepage") {
        await page.mouse.move(0, 0);
        await page.clock.fastForward(9001);
      } else {
        await page
          .getByRole("button", { name: "重新排好", exact: true })
          .click();
      }
      await expect(stage(page)).toHaveAttribute("data-phase", "ready");
    }

    async function chromaticPixels(page: Page) {
      const canvas = stage(page).locator("canvas");
      const canvasBounds = await canvas.boundingBox();
      const line = await stage(page)
        .locator("[data-glyph]")
        .first()
        .locator("..")
        .boundingBox();
      if (!canvasBounds || !line) throw new Error("Missing text raster");
      const png = await canvas.screenshot({ scale: "css" });
      return page.evaluate(
        async ({ source, left, top, width, height }) => {
          const image = new Image();
          image.src = source;
          await image.decode();
          const probe = document.createElement("canvas");
          probe.width = Math.ceil(width);
          probe.height = Math.ceil(height);
          const context = probe.getContext("2d");
          if (!context) throw new Error("Missing pixel reader");
          context.drawImage(image, -left, -top);
          const pixels = context.getImageData(
            0,
            0,
            probe.width,
            probe.height,
          ).data;
          let count = 0;
          const hues = new Map<number, number>();
          for (let i = 0; i < pixels.length; i += 4) {
            const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            // Both themes' first line is neutral. A substantial saturated edge
            // therefore measures dispersion, rather than the blue second line.
            if (delta < 75 || max < 90 || delta / max < 0.32) continue;
            count++;
            const hue =
              max === r
                ? ((g - b) / delta + 6) % 6
                : max === g
                  ? (b - r) / delta + 2
                  : (r - g) / delta + 4;
            const band = Math.floor(hue);
            hues.set(band, (hues.get(band) ?? 0) + 1);
          }
          return {
            count,
            bands: [...hues.values()].filter((n) => n >= 20).length,
          };
        },
        {
          source: `data:image/png;base64,${png.toString("base64")}`,
          left: Math.max(0, line.x - canvasBounds.x - 4),
          top: Math.max(0, line.y - canvasBounds.y - 4),
          width: line.width + 8,
          height: line.height + 8,
        },
      );
    }

    test("lens disperses visible colored light in both themes and clears on leave", async ({
      page,
      isMobile,
    }) => {
      await openPlayground(page);
      await expect(stage(page)).toHaveAttribute("data-renderer", "lens");
      for (const dark of [false, true]) {
        if (dark) {
          await enableDarkMode(page);
          await expect(page.locator("html")).toHaveClass(/dark/);
        }
        const bounds = await stage(page).boundingBox();
        const glyph = await stage(page)
          .locator("[data-glyph]")
          .nth(2)
          .boundingBox();
        if (!bounds || !glyph) throw new Error("Missing title geometry");
        await page.mouse.move(bounds.x - 10, bounds.y + 20);
        await page.waitForTimeout(1600);
        await page.mouse.move(
          glyph.x + glyph.width * 0.6,
          glyph.y + glyph.height * 0.55,
        );
        await page.waitForTimeout(400);
        const active = await chromaticPixels(page);
        console.log(`${dark ? "dark" : "light"} dispersion`, active);
        await page.screenshot({
          path: `/tmp/text-${surface.name}-dispersion-${isMobile ? "mobile" : "desktop"}-${dark ? "dark" : "light"}.png`,
        });
        expect(active.count).toBeGreaterThan(600);
        expect(active.bands).toBeGreaterThanOrEqual(3);
        await page.mouse.move(bounds.x - 10, bounds.y + 20);
        await page.waitForTimeout(500);
        const idle = await chromaticPixels(page);
        expect(idle.count).toBeLessThan(20);
      }
    });

    test("lens renders the actual heading and responds to the pointer", async ({
      page,
      isMobile,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await openPlayground(page);
      await expect(stage(page)).toHaveAttribute("data-renderer", "lens");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);
      if (!isMobile) {
        const rect = await stage(page).boundingBox();
        if (!rect) throw new Error("Missing stage");
        await page.mouse.move(rect.x - 10, rect.y + 20);
        await page.waitForTimeout(1600);
        const before = await stage(page).screenshot();
        const glyph = await stage(page)
          .locator("[data-glyph]")
          .nth(2)
          .boundingBox();
        if (!glyph) throw new Error("Missing glyph");
        await page.mouse.move(
          glyph.x + glyph.width / 2,
          glyph.y + glyph.height / 2,
        );
        await page.waitForTimeout(250);
        const after = await stage(page).screenshot();
        expect(before.equals(after)).toBe(false);
      }
      await page.screenshot({
        path: `/tmp/text-${surface.name}-${isMobile ? "mobile" : "desktop"}-light.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });

    test("letters fall, can be dragged, and return repeatedly", async ({
      page,
      isMobile,
    }) => {
      await openPlayground(page);
      if (surface.name === "homepage") await page.clock.install();
      const original = await stage(page)
        .locator("[data-glyph]")
        .first()
        .boundingBox();
      if (!original) throw new Error("Missing title");
      const origin = await stage(page).boundingBox();
      if (!origin) throw new Error("Missing stage");
      await drop(page);
      await expect
        .poll(async () => {
          const letter = await pieces(page).first().boundingBox();
          const bounds = await stage(page).boundingBox();
          return letter && bounds ? letter.y - bounds.y : 0;
        })
        .toBeGreaterThan(original.y - origin.y + 40);
      await page.waitForTimeout(1100);
      const hit = await pieces(page).evaluateAll((elements) => {
        for (let i = elements.length - 1; i >= 0; i--) {
          const box = elements[i].getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          if (document.elementFromPoint(x, y) === elements[i])
            return { i, x, y };
        }
        return null;
      });
      if (!hit) throw new Error("No draggable letter is visible");
      const bounds = await stage(page).boundingBox();
      if (!bounds) throw new Error("Missing stage");
      const end = {
        x: bounds.x + bounds.width * 0.62,
        y: bounds.y + bounds.height * 0.35,
      };
      if (isMobile) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: hit.x, y: hit.y }],
        });
        for (let i = 1; i <= 12; i++) {
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              {
                x: hit.x + ((end.x - hit.x) * i) / 12,
                y: hit.y + ((end.y - hit.y) * i) / 12,
              },
            ],
          });
          await page.waitForTimeout(20);
        }
        await expect(stage(page)).toHaveAttribute("data-dragging", "true");
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await cdp.detach();
      } else {
        await page.mouse.move(hit.x, hit.y);
        await page.mouse.down();
        await page.mouse.move(end.x, end.y, { steps: 15 });
        await expect(stage(page)).toHaveAttribute("data-dragging", "true");
        await expect
          .poll(
            async () =>
              (await pieces(page).nth(hit.i).boundingBox())?.y ?? hit.y,
          )
          .toBeLessThan(hit.y - 30);
        await page.mouse.up();
      }
      await expect(stage(page)).not.toHaveAttribute("data-dragging", "true");
      await page.screenshot({
        path: `/tmp/text-${surface.name}-${isMobile ? "mobile" : "desktop"}-falling.png`,
        fullPage: false,
      });
      await expect(stage(page)).toHaveAttribute("data-phase", "falling");
      for (let i = 0; i < 2; i++) {
        await restore(page);
        await expect(pieces(page)).toHaveCount(0);
        if (i === 0) await drop(page);
      }
    });

    test("idle restoration waits while a letter is held", async ({ page }) => {
      await openPlayground(page);
      await page.clock.install();
      await drop(page);
      await page.clock.runFor(1000);
      const letter = await pieces(page).last().boundingBox();
      if (!letter) throw new Error("Missing letter");
      await page.mouse.move(
        letter.x + letter.width / 2,
        letter.y + letter.height / 2,
      );
      await page.mouse.down();
      await expect(stage(page)).toHaveAttribute("data-dragging", "true");
      await page.clock.fastForward(11000);
      await expect(stage(page)).toHaveAttribute("data-phase", "falling");
      await page.mouse.up();
      await page.clock.fastForward(9001);
      await expect(stage(page)).toHaveAttribute("data-phase", "returning");
      await expect(stage(page)).toHaveAttribute("data-phase", "ready");
    });

    test("theme, resize, and offscreen pause keep a usable stage", async ({
      page,
      isMobile,
    }) => {
      await openPlayground(page);
      await drop(page);
      const color = await pieces(page)
        .first()
        .evaluate((element) => getComputedStyle(element).color);
      await enableDarkMode(page);
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect
        .poll(() =>
          pieces(page)
            .first()
            .evaluate((element) => getComputedStyle(element).color),
        )
        .not.toBe(color);
      await page.screenshot({
        path: `/tmp/text-${surface.name}-${isMobile ? "mobile" : "desktop"}-dark.png`,
        fullPage: false,
      });
      const size = page.viewportSize();
      if (!size) throw new Error("Missing viewport");
      await page.setViewportSize({
        width: size.width - 40,
        height: size.height,
      });
      await expect(stage(page)).toHaveAttribute("data-phase", "ready");
      await expect(pieces(page)).toHaveCount(0);
      await drop(page);
      await page.evaluate(() => {
        const spacer = document.createElement("div");
        spacer.id = "test-scroll-space";
        spacer.style.height = "1800px";
        document.querySelector("main")?.appendChild(spacer);
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "instant",
        });
      });
      await expect(stage(page)).toHaveAttribute("data-paused", "true");
      const transform = await pieces(page).first().getAttribute("style");
      await page.waitForTimeout(200);
      expect(await pieces(page).first().getAttribute("style")).toBe(transform);
      await page.evaluate(() => {
        document.getElementById("test-scroll-space")?.remove();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await expect(stage(page)).toHaveAttribute("data-paused", "false");
    });

    test("reduced motion keeps readable static text and can be changed live", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(surface.route);
      await expect(stage(page)).toHaveAttribute("data-renderer", "static");
      await expect(
        page.getByRole("heading", { name: "Code. Create." }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name:
            surface.name === "preview" ? "碰一下" : "点击标题，让字母掉下来",
          exact: true,
          includeHidden: true,
        }),
      ).toBeDisabled();
      await expect(pieces(page)).toHaveCount(0);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(stage(page)).toHaveAttribute("data-renderer", "lens");
      await drop(page);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(stage(page)).toHaveAttribute("data-phase", "ready");
      await expect(pieces(page)).toHaveCount(0);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(stage(page)).toHaveAttribute("data-renderer", "lens");
    });

    test("restored WebGL contexts retain the readable fallback", async ({
      page,
    }) => {
      await openPlayground(page);
      await expect(stage(page)).toHaveAttribute("data-renderer", "lens");
      await stage(page)
        .locator("canvas")
        .evaluate((canvas) => {
          if (!(canvas instanceof HTMLCanvasElement))
            throw new Error("Missing canvas");
          const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
          const extension = gl?.getExtension("WEBGL_lose_context");
          if (!extension) throw new Error("Missing context loss extension");
          Reflect.set(window, "__textContextExtension", extension);
          extension.loseContext();
        });
      await expect(stage(page)).toHaveAttribute("data-renderer", "static");
      await page.evaluate(() => {
        (
          Reflect.get(window, "__textContextExtension") as WEBGL_lose_context
        ).restoreContext();
      });
      await expect
        .poll(() =>
          stage(page)
            .locator("canvas")
            .evaluate((canvas) => {
              if (!(canvas instanceof HTMLCanvasElement))
                throw new Error("Missing canvas");
              const gl =
                canvas.getContext("webgl2") || canvas.getContext("webgl");
              return gl?.isContextLost();
            }),
        )
        .toBe(false);
      await expect(stage(page)).toHaveAttribute("data-renderer", "static");
      await expect(
        page.getByRole("heading", { name: "Code. Create." }),
      ).toHaveCSS("opacity", "1");
      await drop(page);
    });

    test("font geometry changes refresh the lens without resizing the stage", async ({
      page,
    }) => {
      await openPlayground(page);
      await expect(stage(page)).toHaveAttribute("data-renderer", "lens");
      const bounds = await stage(page).boundingBox();
      if (!bounds) throw new Error("Missing stage");
      await page.mouse.move(bounds.x - 10, bounds.y + 20);
      await page.waitForTimeout(1600);
      const canvas = stage(page).locator("canvas");
      const before = await canvas.screenshot();
      await page
        .getByRole("heading", { name: "Code. Create." })
        .evaluate((heading) => {
          heading.style.fontSize = "55px";
        });
      await page.waitForTimeout(150);
      const after = await canvas.screenshot();
      expect(before.equals(after)).toBe(false);
      expect((await stage(page).boundingBox())?.width).toBe(bounds.width);
    });

    test("no WebGL still permits falling text", async ({ page }) => {
      await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          ...args: unknown[]
        ) {
          if (String(args[0]).includes("webgl")) return null;
          return Reflect.apply(getContext, this, args);
        } as typeof getContext;
      });
      await openPlayground(page);
      if (surface.name === "homepage") await page.clock.install();
      await expect(stage(page)).toHaveAttribute("data-renderer", "static");
      await expect(
        page.getByRole("heading", { name: "Code. Create." }),
      ).toBeVisible();
      await drop(page);
      await restore(page);
    });

    test("keyboard activation and reset preserve focus", async ({ page }) => {
      await openPlayground(page);
      if (surface.name === "homepage") await page.clock.install();
      const trigger = page.getByRole("button", {
        name: "点击标题，让字母掉下来",
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(stage(page)).toHaveAttribute("data-phase", "falling");
      if (surface.name === "homepage") {
        await restore(page);
        await expect(trigger).toBeFocused();
        return;
      }
      const reset = page.getByRole("button", { name: "重新排好", exact: true });
      await expect(reset).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(stage(page)).toHaveAttribute("data-phase", "ready");
      await expect(
        page.getByRole("button", { name: "碰一下", exact: true }),
      ).toBeFocused();
    });
  });
}

test("homepage artwork stays interactive and letters clean up across navigation", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.getByTestId("text-stage");
  await expect(stage).toHaveAttribute("data-renderer", "lens");
  await expect(page.locator("h1")).toHaveCount(1);
  const accent = stage.locator('[data-accent=""]');
  const originalColor = await accent.evaluate(
    (element) => getComputedStyle(element).color,
  );
  await page
    .getByRole("button", { name: "让小熊猫为整个网站换一组配色" })
    .click();
  await expect
    .poll(() => accent.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(originalColor);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await clickHomeTitle(page);
  await expect(stage).toHaveAttribute("data-phase", "falling");
  await page.getByRole("link", { name: "认识一下我" }).click();
  await expect(page).toHaveURL(/\/about\//);
  await expect(stage).toHaveCount(0);
  await page.goBack();
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await expect(stage).toHaveAttribute("data-renderer", "lens");
  await expect(stage.locator("[data-kinetic-piece]")).toHaveCount(0);
});

test("homepage letters remain above artwork and can be picked up again", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.getByTestId("text-stage");
  const pieces = stage.locator("[data-kinetic-piece]");
  const artwork = page.getByRole("button", {
    name: "让小熊猫为整个网站换一组配色",
  });
  await expect(stage).toHaveAttribute("data-renderer", "lens");
  await clickHomeTitle(page);
  await expect(stage).toHaveAttribute("data-phase", "falling");
  const accent = stage.locator('[data-accent=""]');
  const color = await accent.evaluate(
    (element) => getComputedStyle(element).color,
  );
  await artwork.click();
  await expect
    .poll(() => accent.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(color);
  await expect(stage).toHaveAttribute("data-phase", "falling");
  const hit = await pieces.evaluateAll((elements) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const rect = elements[i].getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (document.elementFromPoint(x, y) === elements[i]) return { i, x, y };
    }
    return null;
  });
  const art = await artwork.boundingBox();
  if (!hit || !art) throw new Error("Missing letter or artwork");
  const destination = { x: art.x + art.width / 2, y: art.y + art.height / 2 };
  await page.mouse.move(hit.x, hit.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 20 });
  await expect(stage).toHaveAttribute("data-dragging", "true");
  const piece = pieces.nth(hit.i);
  await expect
    .poll(async () => {
      const rect = await piece.boundingBox();
      return rect
        ? Math.hypot(
            rect.x + rect.width / 2 - destination.x,
            rect.y + rect.height / 2 - destination.y,
          )
        : Infinity;
    })
    .toBeLessThan(25);
  await expect
    .poll(() =>
      piece.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return (
          document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          ) === element
        );
      }),
    )
    .toBe(true);
  // Hold animation time still to check hit testing, independently of the
  // released body's momentum (throwing is covered by the physics checks).
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
  await page.mouse.up();
  await expect(stage).not.toHaveAttribute("data-dragging", "true");
  const rect = await piece.boundingBox();
  if (!rect) throw new Error("Missing released letter");
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await page.mouse.up();
});
