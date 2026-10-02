# CryptoPurrls

**10.000 con mèo pixel 24×24 mọc ra từ một logo.**

![40 Purrl đầu tiên](dist/preview.png)

Logo Purrl là một hình khối 14×14: đầu vuông, tai trái cao 3 ô, tai phải thấp 2 ô, cằm vát hai góc. Mọi CryptoPurrl giữ nguyên silhouette đó, đặt 1:1 lên khung 24×24. Toàn bộ bộ sưu tập là hàm thuần của một seed, nên ai cũng dựng lại được đúng 10.000 con và kiểm tra với provenance hash bên dưới.

```
####..........      ← tai trái cao
####......####      ← tai phải thấp; khoảng trống ở giữa là chỗ đội mũ
####......####
##############
      ×10
.############.      ← cằm vát
```

## Chiều sâu

Mỗi Purrl được dựng qua năm lớp: **Logo → Silhouette → Light → Face → Traits**.

- **Ánh sáng bốn tông.** Mỗi pixel của con mèo mang một chất liệu (lông, vằn, vải…) và một tông (sáng, gốc, tối, khuất) lấy từ bản đồ ánh sáng vẽ tay, với nguồn sáng ở phía trên bên trái. Mỗi chất liệu được giãn thành bốn tông, trong đó vùng sáng ngả ấm, vùng tối ngả lạnh và tím. Đây là cách các họa sĩ pixel tạo khối.
- **Bóng đổ.** Con mèo đổ bóng xuống nền, lệch 2px sang phải và 1px xuống dưới.
- **Ánh sáng viền.** Mép trái hắt màu sáng của nền, mép phải hắt màu thứ hai, nên mỗi con như đang đứng trong môi trường của chính nó.
- **Nền gradient dither.** Các dải màu phẳng nối với nhau bằng một dải dither Bayer hẹp, cộng thêm vignette ở bốn góc.
- **Hai lớp hạt.** Trait Aura rải hạt vừa sau lưng vừa trước mặt con mèo. Hạt phía sau nhỏ và mờ, hạt phía trước lớn và sáng.
- **Đồ vật có chiều sâu.** Vành đai Orbit đi vòng ra sau đầu rồi vòng lại phía trước. Lông Crystal và lọ Brain Jar trong suốt, nhìn xuyên được ra nền.

## Huyền thoại

Mười bộ lông có số lượng cố định. Những bộ lông còn lại được quay ngẫu nhiên theo trọng số. Cosmic, Lava, Crystal, Leopard và Moo vẽ hoa văn theo số hiệu của từng con, nên không con nào giống con nào.

| Bộ lông | Số lượng | Đặc điểm |
|---|---:|---|
| **Genesis** | 1 | Purrl #0 chính là logo, được đùn sâu ba pixel xuyên qua một lăng kính, trên nền mực. |
| **Pearl** | 9 | Lông xà cừ với những dải hồng, kem, bạc hà chạy chéo. Đây là nguồn gốc của cái tên *Purrl*. |
| **Void** | 13 | Một hố đen hình con mèo: chỉ còn đôi mắt, viền neon tím và quầng sáng hắt ra nền. |
| **Gold** | 24 | Vàng đánh bóng, có vệt loé chéo. Không bao giờ đi cùng phụ kiện vàng. |
| **Cosmic** | 42 | Bên trong bộ lông là một dải thiên hà, mỗi con có một bầu trời sao riêng. |
| **Chrome** | 55 | Kim loại lỏng phản chiếu đường chân trời. |
| **Crystal** | 66 | Pha lê trong suốt, nhìn xuyên qua thấy nền phía sau. |
| **Lava** | 77 | Đá bazan nứt với dung nham sáng trong các khe. |
| **Glitch** | 88 | Tín hiệu hỏng: viền tách màu RGB và vài dòng quét bị xé lệch. |
| **Zombie** | 111 | Lông xanh rêu, có vết khâu và một miếng da vá. |

![Genesis và 9 Pearl](dist/legendary.png)

![Bốn con hiếm nhất của mỗi tier, từ Pearl đến Zombie](dist/tiers.png)

## Trait

Số con mang từng trait trong 10.000 Purrl:

- **Fur**: Cream 1.266 · Ginger 1.231 · Smoke 988 · Midnight 887 · Tuxedo 818 · Calico 685 · Siamese 595 · Bubblegum 581 · Lilac 534 · Mint 491 · Tiger 373 · Moo 309 · Leopard 291 · Neon 290 · Rainbow 175 · Zombie 111 · Glitch 88 · Lava 77 · Crystal 66 · Chrome 55 · Cosmic 42 · Gold 24 · Void 13 · Pearl 9 · Genesis 1
- **Background**: Sunset 1.132 · Lagoon 1.082 · Citrus 960 · Bubblegum 955 · Vaporwave 891 · Mint Soda 824 · Lavender 811 · Purrl Blue 731 · Aurora 574 · Ember 547 · Toxic 451 · Starfield 324 · Synthwave 281 · Matrix 180 · Prism 168 · Void 88 · Ink 1
- **Eyes**: Emerald 1.293 · Amber 1.162 · Sapphire 1.044 · Copper 767 · Amethyst 569 · Sleepy 488 · Ruby 456 · Ice 336 · Hearts 305 · Stars 275 · Odd Eyes 271 · Wink 255 · Third Eye 190 · KO 186 · Neon Glow 139 · Void 134 · Cyclops 131 · Laser 96
- **Mouth**: Purr 2.821 · Smile 1.793 · Blep 1.513 · Hiss 758 · Bubblegum 734 · Pipe 547 · Gold Grill 454 · Fish 433 · Rainbow Tongue 343 · Diamond Grill 237 · Tentacles 196 · Fire Breath 170
- **Eyewear**: Shades 797 · Specs 612 · 3D Glasses 408 · Neon Visor 355 · Monocle 349 · Holo Shades 342 · Eye Patch 333 · Cyber Eye 174
- **Headwear**: Headphones 614 · Top Hat 585 · Beanie 562 · Party Hat 479 · Flower 461 · Bow 458 · Mushroom 364 · Halo 340 · Antenna 340 · Devil Horns 332 · Wizard Hat 306 · Orbit 246 · Crystal Shards 245 · Flame 232 · Unicorn Horn 230 · Brain Jar 112 · Crown 104
- **Outfit**: Collar & Bell 1.501 · Bow Tie 862 · Hoodie 824 · Gold Chain 807 · Suit 658 · Scarf 645 · Puffer 418 · Armor 336 · Pearl Necklace 325 · Astronaut 321 · Kimono 316 · Rune Robe 222
- **Earring**: Pearl Earring 421 · Gold Hoop 325 · Diamond Stud 81
- **Aura**: Sparkles 1.037 · Bubbles 679 · Fireflies 610 · Snow 605 · Embers 575 · Petals 513 · Hearts 481 · Glitch 322 · Orbs 307 · Lightning 218

Một số luật ghép trait:

- Con nào đeo kính che mắt (Shades, Holo Shades, 3D Glasses, Neon Visor) thì không có trait Eyes.
- Các kiểu mắt nổi bật (Laser, Cyclops, Third Eye, Hearts, Stars, KO) không bao giờ bị kính che.
- Mỗi bộ lông tránh những trait sẽ bị chìm vào nó, ví dụ Gold không đeo dây chuyền vàng và Void không đeo kính đen.
- Không có hai Purrl nào trùng toàn bộ trait.

Hạng độ hiếm được tính theo kiểu rarity.tools: điểm là tổng `10.000 / số con mang trait` của mọi loại trait (tính cả "None") cộng thêm số phụ kiện. Hạng 1 là con hiếm nhất (#0 Genesis).

## Provenance

| | |
|---|---|
| Seed | `0x50555252` ("PURR") |
| Provenance hash | `f5cf9fab815ffedc1fa7babcc8c0a5b9036aaa7dd66179c2755086260f0f9833` |
| SHA-256 của mosaic | `1b0535953ac2729f366b902850c6eaf5d110b8ac8ffe6e76f7af7c6a22e05815` |

Provenance hash là `sha256` của chuỗi nối các `sha256` dạng hex của từng Purrl, theo thứ tự #0 → #9999. Mỗi `sha256` được tính trên 2.304 byte RGBA thô (24×24×4) của Purrl đó. Hash mosaic được tính trên pixel RGBA của `dist/purrls.png` (2400×2400, 100 con mỗi hàng). Vì băm trên pixel chứ không băm byte PNG, kết quả không phụ thuộc phiên bản zlib. Trang gallery có nút xác minh, bấm vào sẽ dựng lại cả 10.000 con ngay trong trình duyệt và so với hai hash này.

## Cách chạy

Chỉ cần Node 18 trở lên, không có dependency nào.

```bash
npm run build       # dist/: mosaic, purrls.json, rarity.json, provenance.json, ảnh preview
npm run build:all   # thêm dist/images/<id>.png (480×480) và dist/metadata/<id>.json (ERC-721)
npm run serve       # gallery tại http://localhost:4173
```

Metadata ERC-721 để sẵn `ipfs://<IMAGES_CID>/<id>.png`. Sau khi upload thư mục `dist/images` lên IPFS, thay `<IMAGES_CID>` bằng CID thật.

## Cấu trúc

| File | Nội dung |
|---|---|
| `src/purrl.js` | Toàn bộ generator: silhouette, bản đồ ánh sáng, ramp màu, nền, sprite của từng trait, trọng số, PRNG (mulberry32), render và tính độ hiếm. Là ES module thuần, chạy được cả trong Node lẫn trình duyệt. |
| `scripts/build.mjs` | Dựng collection rồi ghi mọi thứ vào `dist/`. |
| `scripts/png.mjs` | Bộ mã hoá PNG tối giản dựa trên `node:zlib`. |
| `scripts/serve.mjs` | Server xem thử gallery ở máy. |
| `site/index.html` | Trang gallery: trưng bày từng lớp dựng hình, các tier huyền thoại, bộ lọc trait, mosaic và nút xác minh provenance. |
| `dist/purrls.png` | Mosaic 2400×2400 chứa đủ 10.000 Purrl ở tỉ lệ 1×. |
| `dist/purrls.json` | Trait và hạng độ hiếm của từng Purrl. |

Sửa sprite, màu hay trọng số trong `src/purrl.js` sẽ làm thay đổi bộ sưu tập và provenance hash. Hãy chạy lại `npm run build` rồi commit cả `dist/`.
