# CryptoPurrls

**20 sinh vật pixel 24×24 mọc ra từ một logo. Không có trait nào xuất hiện hai lần.**

![Toàn bộ 20 Purrl](dist/preview.png)

Logo Purrl là một khối 14×14: đầu vuông, chỏm trái cao 3 ô, chỏm phải thấp 2 ô, cằm vát hai góc. Mỗi Purrl là một sinh vật mang đúng silhouette đó, đặt 1:1 lên khung 24×24.

```
####..........      ← chỏm trái cao
####......####      ← chỏm phải thấp; khoảng trống ở giữa là chỗ đội mũ
####......####
##############
      ×10
.############.      ← cằm vát
```

## Phong cách

Gọn như một con tem: **nền một màu phẳng sáng nhạt, viền mực sắc, nhân vật rực màu.** Mỗi chất liệu chỉ có hai tông là màu gốc và một tông bóng ở mép phải, dưới cằm và cổ.

## Mọi trait đều 1/1

Có 6 loại trait: Body, Background, Eyes, Mouth, Headwear, Outfit. Mỗi loại có một danh sách giá trị được xáo trộn theo seed rồi chia lần lượt cho từng con, nên **mỗi giá trị chỉ có đúng một con mang**. Kính được gộp vào trait Eyes. Nếu một nhân vật mang trait bị chìm vào màu thân (ví dụ thân Gold đội Medal vàng, hay thân Mint trên nền Mint), lần chia đó bị huỷ và chia lại.

Purrl #0 **Genesis** chính là logo, được đùn sâu ba pixel xuyên qua một lăng kính, trên nền mực.

| # | Body | Background | Eyes | Mouth | Headwear | Outfit |
|---|---|---|---|---|---|---|
| #0 | Genesis | Ink | — | — | — | — |
| #1 | Pearl | Bubblegum | Ice | Lollipop | Brain Jar | Rune Robe |
| #2 | Leopard | Mauve | Ruby | Gold Grill | Party Hat | Bow Tie |
| #3 | Neon | Pearl | Holo Shades | Stitched | Crown | Gold Chain |
| #4 | Rainbow | Lime | Monocle | Braces | Headphones | Tie-Dye |
| #5 | Void | Tangerine | 3D Glasses | Buck Teeth | Devil Horns | Armor |
| #6 | Cosmic | Gold | Amethyst | Mustache | Propeller Cap | Scarf |
| #7 | Cream | Sky | Sleepy | Hiss | Bow | Kimono |
| #8 | Bubblegum | Lemon | Stars | Zipper | Unicorn Horn | Hoodie |
| #9 | Lilac | Coral | Wink | Pipe | Halo | Medal |
| #10 | Crystal | Sand | Cyclops | Blep | Mushroom | Striped Sweater |
| #11 | Mint | Butter | Neon Visor | Gasp | Crystal Shards | Jersey |
| #12 | Moo | Sage | Void | Bubblegum | Bandana | Collar & Bell |
| #13 | Chrome | Purrl Blue | Neon Glow | Tentacles | Orbit | Suit |
| #14 | Zombie | Lavender | Shades | Kiss | Flame | Overalls |
| #15 | Smoke | Periwinkle | Laser | Rainbow Tongue | Flower | Pearl Necklace |
| #16 | Tiger | Cloud | Cyber Eye | Grin | Antenna | Lab Coat |
| #17 | Gold | Aqua | Hearts | Fire Breath | Wizard Hat | Puffer |
| #18 | Midnight | Mint | Odd Eyes | Diamond Grill | Top Hat | Astronaut |
| #19 | Lava | Peach | Third Eye | Smile | Sprout | Cape |

Một số Body như Cosmic, Lava, Crystal, Leopard và Moo vẽ hoa văn theo số hiệu. Mỗi danh sách trait có từ 19 đến 20 giá trị; những giá trị chưa được chia sẽ dành cho các đợt sau.

## Provenance

| | |
|---|---|
| Seed | `0x50555252` ("PURR") |
| Provenance hash | `86a0848c84396a56b7c08bd40999a073d33e59c60621d7d7f9dcb7125e837bd1` |
| SHA-256 của mosaic | `452e4a6e1258df00f1f538b4bd97750ecd4c461340c065a2384a3573600e7164` |

Provenance hash là `sha256` của chuỗi nối các `sha256` dạng hex của từng Purrl, theo thứ tự #0 → #19. Mỗi `sha256` được tính trên 2.304 byte RGBA thô (24×24×4). Hash mosaic được tính trên pixel RGBA của `dist/purrls.png` (120×96, 5 con mỗi hàng). Trang gallery có nút xác minh, bấm vào sẽ dựng lại cả bộ ngay trong trình duyệt và so với hai hash này.

## Cách chạy

Chỉ cần Node 18 trở lên, không có dependency nào.

```bash
npm run build       # dist/: mosaic, purrls.json, rarity.json, provenance.json, preview
npm run build:all   # thêm dist/images/<id>.png (480×480) và dist/metadata/<id>.json (ERC-721)
npm run serve       # gallery tại http://localhost:4173
```

Metadata ERC-721 để sẵn `ipfs://<IMAGES_CID>/<id>.png`. Sau khi upload thư mục `dist/images` lên IPFS, thay `<IMAGES_CID>` bằng CID thật.

## Cấu trúc

| File | Nội dung |
|---|---|
| `src/purrl.js` | Toàn bộ generator: silhouette, bản đồ tông, ramp màu, sprite của từng trait, cách chia trait 1/1 và render. Là ES module thuần, chạy được cả trong Node lẫn trình duyệt. |
| `scripts/build.mjs` | Dựng collection rồi ghi mọi thứ vào `dist/`. |
| `scripts/png.mjs` | Bộ mã hoá PNG tối giản dựa trên `node:zlib`. |
| `scripts/serve.mjs` | Server xem thử gallery ở máy. |
| `site/index.html` | Trang gallery: trưng bày từng lớp dựng hình, bộ lọc trait, mosaic và nút xác minh provenance. |

Sửa sprite, màu, danh sách trait hay `SUPPLY` trong `src/purrl.js` sẽ làm thay đổi bộ sưu tập và provenance hash. Hãy chạy lại `npm run build` rồi commit cả `dist/`.
