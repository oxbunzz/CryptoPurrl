# CryptoPurrls

**20 nhân vật pixel 32×32 vẽ tay, mọc ra từ một logo. Mỗi con là một bản 1/1, không trait nào lặp lại.**

![Toàn bộ 20 Purrl](dist/preview.png)

Đầu của mọi Purrl là logo thu về 12×12: chỏm trái cao, chỏm phải thấp, khoảng khuyết ở giữa (chỗ đội mũ) và cằm vát. Nhân vật nhỏ, đứng sát mép dưới khung 32×32, quay mặt sang phải (có một chấm mũi nhô ra), nên làm ảnh đại diện vẫn gọn.

```
###.........      ← chỏm trái cao
###......###      ← chỏm phải thấp
###......###
############
     ×8
.##########.      ← cằm vát
```

## Phong cách

- Ánh sáng từ phía trước (bên phải): ba tông gồm điểm sáng trên đầu, màu gốc, và bóng ở gáy, cằm và mép dưới.
- Viền đen rõ, nền một màu nhạt.
- Mắt có tròng trắng và con ngươi cùng nhìn sang phải.
- Mỗi nhân vật có trang phục, mũ và đồ vật cầm tay riêng.
- Khi có mũ, khoảng khuyết giữa hai chỏm được lấp bằng màu mũ để mũ ngồi khít trên đầu.

## 20 nhân vật

Mỗi nhân vật được thiết kế riêng chứ không ghép trait ngẫu nhiên. Có 7 loại trait: Character, Body, Background, Eyes, Headwear, Outfit, Item. Mỗi giá trị chỉ xuất hiện ở đúng một con; module sẽ báo lỗi ngay khi tải nếu có giá trị nào bị lặp. Purrl #0 **Genesis** chính là logo: thân màu kem trên nền mực, không đội mũ, không mặc gì.

| # | Character | Body | Background | Eyes | Headwear | Outfit | Item |
|---|---|---|---|---|---|---|---|
| #0 | Genesis | Cream | Ink | Plain | None | None | None |
| #1 | Astronaut | Sky | Periwinkle | Starry | Antenna Helmet | Space Suit | Flag |
| #2 | Samurai | Tangerine | Sand | Fierce | Hachimaki | Red Armor | Katana |
| #3 | Wizard | Lilac | Mint | Wise | Star Hat | Robe | Orb Staff |
| #4 | DJ | Teal | Bubblegum | Vibing | Headphones | Hoodie & Chain | Vinyl |
| #5 | Chef | Peach | Butter | Proud | Toque | Chef Coat | Spoon |
| #6 | Pirate | Mint | Sky | Eye Patch | Tricorn | Striped Shirt | Cutlass |
| #7 | Knight | Rose | Lime | Brave | Plume | Plate Armor | Shield |
| #8 | Detective | Mocha | Aqua | Curious | Fedora | Trench Coat | Magnifier |
| #9 | Painter | Blush | Cloud | Dreamy | Beret | Paint Smock | Brush |
| #10 | Skater | Lime | Coral | Chill | Backwards Cap | Graphic Tee | Skateboard |
| #11 | Gardener | Coral | Sage | Gentle | Straw Hat | Overalls | Watering Can |
| #12 | Rockstar | Charcoal | Peach | Wild | Mohawk | Leather Jacket | Guitar |
| #13 | Scientist | Mustard | Purrl Blue | Goggles | Lab Goggles | Lab Coat | Flask |
| #14 | Ninja | Cobalt | Pearl | Narrow | Ninja Hood | Gi | Shuriken |
| #15 | King | Gold | Mauve | Regal | Crown | Royal Cape | Scepter |
| #16 | Diver | Grape | Lavender | Snorkel Mask | Snorkel | Swim Ring | Rubber Duck |
| #17 | Firefighter | Ash | Gold | Alert | Fire Helmet | Turnout Coat | Axe |
| #18 | Cowboy | Snow | Tangerine | Squint | Ten-Gallon Hat | Sheriff Vest | Lasso |
| #19 | Dreamer | Midnight | Lemon | Sleepy | Nightcap | Star Pajamas | Teddy |

## Provenance

| | |
|---|---|
| Provenance hash | `231cfc084ca4cd8ab1072e2c3e749abace4f705db40cb9b6e8e4a5870133193e` |
| SHA-256 của mosaic | `371d2ca42fcd398bd8378cb6b6fd5288a44443fdd741c28a6b83f8c169790ba0` |

Provenance hash là `sha256` của chuỗi nối các `sha256` dạng hex của từng Purrl, theo thứ tự #0 → #19. Mỗi `sha256` được tính trên 4.096 byte RGBA thô (32×32×4). Hash mosaic được tính trên pixel RGBA của `dist/purrls.png` (160×128, 5 con mỗi hàng). Trang gallery có nút xác minh, bấm vào sẽ dựng lại cả bộ ngay trong trình duyệt và so với hai hash này.

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
| `src/purrl.js` | Silhouette, tông sáng, khuôn mặt và bản vẽ của 20 nhân vật (mỗi con một hàm `draw`), kèm kiểm tra không trùng trait. Là ES module thuần, chạy được cả trong Node lẫn trình duyệt. |
| `scripts/build.mjs` | Dựng collection rồi ghi mọi thứ vào `dist/`. |
| `scripts/png.mjs` | Bộ mã hoá PNG tối giản dựa trên `node:zlib`. |
| `scripts/serve.mjs` | Server xem thử gallery ở máy. |
| `site/index.html` | Trang gallery: trưng bày từng lớp dựng hình, bộ lọc trait, mosaic và nút xác minh provenance. |

Sửa bản vẽ trong `src/purrl.js` sẽ làm thay đổi provenance hash. Hãy chạy lại `npm run build` rồi commit cả `dist/`.
