# Báo cáo chuẩn bị GitHub Pages

Ngày 18/11/2026. Phạm vi: kiểm tra dự án hiện có và chuẩn bị triển khai, chưa push hoặc publish.

## Công nghệ

HTML/CSS/JavaScript thuần (ES Modules), SVG, SheetJS khi nhập/xuất Excel, Supabase JS khi cấu hình tài khoản thật. Node.js dùng để kiểm tra và gộp tệp. Không có React, Vite, framework router hoặc backend chạy trên GitHub Pages. SQL/RLS và Edge Function dành cho Supabase được giữ nguyên.

## Thay đổi

1. Thêm script `build` tạo `pages-dist` riêng và `check:pages` kiểm tra artifact; khai báo Node >=22.
2. Cho script build-single nhận `--out-dir pages-dist`; cách gọi cũ và thư mục dist giữ nguyên.
3. Thêm `.nojekyll` vào artifact mới; kiểm tra không còn phụ thuộc tệp cục bộ, đường dẫn ổ đĩa hoặc đường dẫn tuyệt đối từ gốc website.
4. Thêm workflow `.github/workflows/pages.yml`: Node 22 → kiểm tra cú pháp → 8 kiểm thử quy tắc điểm → build → kiểm tra Pages → upload artifact → deploy. Chỉ deploy nhánh main, có môi trường github-pages và quyền pages/id-token cho job deploy. Không chạy SQL hoặc phục hồi dữ liệu trong CI.
5. Cung cấp workflow tại gốc workspace và trong dự án. Workflow tự tìm dự án ở gốc repository hoặc thư mục toan-qlcl. Khi tải riêng dự án lên kho mới, dùng thư mục .github bên trong dự án.
6. Bổ sung .gitignore gốc loại output/ khỏi Git; thêm pages-dist/ vào .gitignore dự án để tránh nhầm mã nguồn với tệp build.
7. Thêm hướng dẫn từng bước, lỗi thường gặp và cách bảo toàn dữ liệu khi đổi địa chỉ.

## Bảo toàn

Trước sửa đã tạo ZIP sao lưu trong output và ghi SHA-256 các tệp cũ vào output/pages_before_hashes.json.

Đối chiếu sau sửa: chỉ bốn tệp cũ thay đổi là package.json, .gitignore, README.md và tools/build-single.mjs. Không mất tệp cũ. app.js, core.js, data.js, demo.js, index.html, style.css, config.js, schema SQL và hàm cấp tài khoản không thay đổi.

**pages-dist/index.html có cùng SHA-256 với dist/index.html và output/index.html hiện có.** Giao diện, logic, dữ liệu mẫu nhúng, định dạng sao lưu và khóa localStorage được giữ nguyên. Không dùng trình duyệt để xóa/reset/ghi dữ liệu, không kết nối hoặc thay đổi cơ sở dữ liệu thật. Các kiểm tra backend chạy trên cơ sở dữ liệu tạm trong bộ nhớ.

ZIP giao diện và tệp HTML đầu ra cũ cũng giữ nguyên. Bộ GitHub Pages được đóng gói thành tệp ZIP mới để tránh ghi đè bản giao trước.

## Kiểm tra đã đạt

- 8 kiểm thử quy tắc điểm/thống kê và 23 kiểm tra PostgreSQL/RLS mô phỏng, bao gồm bài thử 25 giáo viên/50 lớp/2.000 học sinh.
- Build thành công; kiểm tra artifact chỉ có index.html và .nojekyll.
- HTTP smoke test tại `/`, `/index.html`, `/Math.p1/`, `/Math.p1/index.html`; nội dung trả về đúng bản HTML build. Kiểm tra không công khai backend/schema.sql qua artifact.
- Kiểm tra URL/public key Supabase cùng được điền hoặc cùng trống; chặn sb_secret và JWT service_role trong config.js.
- Đối chiếu mã băm và kiểm tra không mất tệp.
- Đối chiếu cấu trúc workflow với tài liệu GitHub chính thức. Chưa chạy workflow trên GitHub; môi trường cục bộ không có bộ phân tích YAML riêng, nên không khẳng định đã xác minh bằng GitHub runner.

Máy chạy hiện có Node 24 nhưng không có npm trên PATH. Đã chạy trực tiếp các lệnh Node đúng như các script npm: `node --test tests/*.test.mjs`, `node tools/build-single.mjs --out-dir pages-dist`, `node tools/check-pages.mjs`, `node tools/test-backend.mjs`. GitHub Actions dùng setup-node để cung cấp Node 22 và npm; không cần npm install cho build frontend.

## Giới hạn trước khi dùng thật

- config.js vẫn trống như ban đầu, nên website chạy bản mẫu. Chưa có Supabase thật để kiểm tra đăng nhập mạng/Edge Function.
- Không thử lại giao diện bằng thao tác trình duyệt trong lần chuẩn bị này để tránh chạm dữ liệu người dùng đang mở. Bản deploy byte-identical với bản giao diện đã có; đây là bằng chứng bảo toàn, không phải kiểm thử E2E trên GitHub.
- Dữ liệu mẫu theo origin: chuyển từ file:// hoặc localhost sang github.io cần sao lưu/phục hồi thủ công; không tự di chuyển.
- GitHub Pages chỉ chạy giao diện tĩnh; không chạy cơ sở dữ liệu hoặc hàm cấp tài khoản.
- Các CDN và phông ngoài cần mạng; CSV và phông hệ thống dự phòng hiện có vẫn giữ nguyên.
- Chưa chạy Actions hoặc xác minh URL công khai vì người dùng yêu cầu chuẩn bị và tự đưa lên GitHub sau.

Xem TRIEN_KHAI_GITHUB_PAGES.md để triển khai và kiểm tra sau triển khai.
