# CryptoPurrls

**20 PFP pixel 32×32 mọc ra từ một logo. Không trait nào xuất hiện hai lần.**

![Toàn bộ 20 Purrl](dist/preview.png)

Mỗi Purrl là một chân dung bán thân theo phong cách pixel PFP:
- Đầu là logo đặt 1:1, gồm khối 14×14 với chỏm trái cao, chỏm phải thấp và cằm vát.
- Đầu quay 3/4 sang phải, có vùng mặt và mõm sáng màu nhô ra phía trước.
- Mắt to có tròng trắng, con ngươi nhìn sang phải.
- Vai bị cắt ở mép dưới khung.

```
####..........      ← chỏm trái cao
####......####      ← chỏm phải thấp
####......####
##############
      ×10
.############.      ← cằm vát
```

## Phong cách

- Viền mực dày, màu phẳng với một tông sáng và một tông bóng; ánh sáng từ phía trước nên gáy tối hơn.
- Nền một màu.
- Mỗi con có đúng một mũ hoặc kiểu tóc và một chiếc áo, không có đồ cầm tay để khung hình gọn.

## Mọi trait đều 1/1

Có 6 loại trait: Fur, Background, Eyes (gồm cả kính), Mouth, Headwear, Outfit. Mỗi danh sách có 19–20 giá trị và được xáo một lần theo seed `0x50555252` rồi chia lần lượt, nên mỗi giá trị chỉ có đúng một con mang. Nếu màu lông quá gần màu nền, lần chia đó bị bỏ và chia lại. Purrl #0 **Genesis** chính là logo: đầu màu kem trên nền mực.

| # | Fur | Background | Eyes | Mouth | Headwear | Outfit |
|---|---|---|---|---|---|---|
| #0 | Genesis | Ink | — | — | — | — |
| #1 | Ice | Lime | Heart Glasses | Kiss | Fedora | Gold Chain |
| #2 | Gray | Orchid | Nerd Glasses | Toothpick | Headband | Trench Coat |
| #3 | Gold | Bone | Green | Mustache | Spiky Hair | Tie-Dye |
| #4 | Red | Rose | Happy | Smirk | Beret | Overalls |
| #5 | Golden | Teal | Red | Bandana Mask | Flower | Tank Top |
| #6 | Green | Apricot | Visor | Grin | Bandana | Kimono |
| #7 | Cocoa | Powder | Eye Patch | Drool | Beanie | Puffer |
| #8 | Silver | Salmon | Blue | Smile | Cowboy Hat | Varsity Jacket |
| #9 | Purple | Blossom | Ski Goggles | Face Mask | Party Hat | Jersey |
| #10 | Orange | Lilac | Classic | Lollipop | Halo | Hawaiian Shirt |
| #11 | White | Seafoam | Stars | Pipe | Propeller Cap | Raincoat |
| #12 | Yellow | Coral | Laser | Frown | Headphones | Lab Coat |
| #13 | Pink | Slate | Tired | Gold Grill | Cap | Denim Jacket |
| #14 | Cyan | Fern | Aviators | Beard | Backwards Cap | Sweater |
| #15 | Black | Wheat | 3D Glasses | Cigarette | Top Hat | Tracksuit |
| #16 | Blue | Cornflower | Monocle | Bubblegum | Sailor Cap | Hoodie |
| #17 | Zombie | Sun | Sleepy | Open | Bowler | Turtleneck |
| #18 | Teal | Steel | Angry | Fangs | Mohawk | Leather Jacket |
| #19 | Brown | Sky | Wide | Tongue | Crown | T-Shirt |

## Provenance

| | |
|---|---|
| Seed | `0x50555252` ("PURR") |
| Provenance hash | `fd2714bbd13bbfbb3d7d24a680cc30c91ab8a1282049484212fa4e684d8b7308` |
| SHA-256 của mosaic | `3884cdb63101e66dcfde7b7eac95840aab12dd3253d5fed40cf7445c028d7ec4` |

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
| `src/purrl.js` | Silhouette, tông sáng, sprite của từng trait, cách chia trait 1/1 và render. Là ES module thuần, chạy được cả trong Node lẫn trình duyệt. |
| `scripts/build.mjs` | Dựng collection rồi ghi mọi thứ vào `dist/`. |
| `scripts/png.mjs` | Bộ mã hoá PNG tối giản dựa trên `node:zlib`. |
| `scripts/serve.mjs` | Server xem thử gallery ở máy. |
| `site/index.html` | Trang gallery: trưng bày từng lớp dựng hình, bộ lọc trait, mosaic và nút xác minh provenance. |

Sửa sprite hoặc danh sách trait trong `src/purrl.js` sẽ làm thay đổi provenance hash. Hãy chạy lại `npm run build` rồi commit cả `dist/`.
