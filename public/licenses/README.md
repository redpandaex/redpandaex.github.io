# Third-party notices

## Text playground

The homepage title and standalone typography preview use `ogl` 1.0.11 (Unlicense, https://github.com/oframe/ogl) and `matter-js` 0.20.0 (MIT, https://github.com/liabru/matter-js).

- `ogl-UNLICENSE.txt`: Unlicense text from the package README.
- `matter-js-LICENSE.txt`: unmodified license shipped with the package.

## Image conversion engine

The image converter uses `@imagemagick/magick-wasm` 0.0.45 by Dirk Lemstra, distributed under Apache-2.0. Source: https://github.com/dlemstra/magick-wasm.

- `magick-wasm-LICENSE.txt`: unmodified wrapper license from upstream.
- `magick-wasm-NOTICE.txt`: unmodified NOTICE shipped with this version, including ImageMagick Studio LLC attribution and bundled codec notices.

The embedded 480-byte sRGB ICC profile is from https://github.com/saucecontrol/Compact-ICC-Profiles, released under CC0. The exact source blob is recorded in `lib/tools/image-conversion.worker.ts`.
