# Image conversion fixtures

Unmodified HEVC images from [strukturag/libheif](https://github.com/strukturag/libheif), retrieved on 2026-10-20. Upstream license: [LGPL-3.0](https://github.com/strukturag/libheif/blob/master/COPYING).

| Local file | Upstream file | Git blob SHA | Size |
| --- | --- | --- | --- |
| `conformance-window-padding.heic` | [tests/data/conformance_window_padding.heic](https://github.com/strukturag/libheif/blob/master/tests/data/conformance_window_padding.heic) | `3daf5681e22df6ef719aad549d75ce27907a0ecf` | 656 bytes |
| `hevc32.heif` | [fuzzing/data/corpus/hevc32.heif](https://github.com/strukturag/libheif/blob/master/fuzzing/data/corpus/hevc32.heif) | `5c4085cfb03e2b57c5dbe1bcedd2893f552cf8ef` | 523 bytes |

The HEIC fixture checks a real cropped 1×1 image. The HEIF fixture is a valid 32×32 HEVC seed. Tests decode their original bytes with the shipped WASM engine. PNG fixtures are generated in memory by the tests.

`DisplayP3-v4.icc` (480 bytes, Git blob `4ee40fb5eeb6dfde851c989ecc7c3ebd496ba9fc`) is from [Compact ICC Profiles](https://github.com/saucecontrol/Compact-ICC-Profiles/blob/master/profiles/DisplayP3-v4.icc), released under [CC0](https://github.com/saucecontrol/Compact-ICC-Profiles/blob/master/license). Retrieved on 2026-10-20. It verifies that profile removal follows an actual color transformation. The worker embeds the same project's 480-byte `sRGB-v4.icc` (Git blob `d9f3c055bd4d7573124090569e1b9533932214eb`) as its target profile.
