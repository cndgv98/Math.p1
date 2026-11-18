# Đưa website Tổ Toán lên GitHub Pages

## Công nghệ và bản triển khai

Dự án dùng HTML, CSS, JavaScript ES Modules, biểu đồ SVG và một script gộp viết bằng Node.js. Không sử dụng React, Vite, Vue hoặc bộ định tuyến SPA. Không cần cài các gói npm để build giao diện. PGlite trong devDependencies chỉ phục vụ kiểm thử cơ sở dữ liệu, không đưa lên website.

- `npm run build`: tạo **pages-dist/index.html** và **pages-dist/.nojekyll**.
- `npm run check:pages`: kiểm tra cấu trúc, đường dẫn, cấu hình và khả năng phục vụ tại thư mục con như `/Math.p1/`.
- Quy trình không thay đổi `dist/index.html`, `output/index.html`, mã giao diện, dữ liệu mẫu, khóa localStorage, cơ sở dữ liệu hay bản sao lưu hiện có.
- Bản build chỉ gộp các tệp đang dùng; không thêm màn hình, không đổi tính toán, không cài backend lên GitHub Pages.
- Workflow chỉ upload **pages-dist**, không upload SQL, tệp tham chiếu, bản sao lưu hoặc dữ liệu nghiệp vụ làm nội dung website.

## Trước khi chuyển địa chỉ website

Nếu đã nhập dữ liệu vào bản mẫu ở `file://` hoặc localhost, dữ liệu đang ở localStorage của trình duyệt tại địa chỉ đó. GitHub Pages có địa chỉ khác nên sẽ có vùng lưu trữ khác; dữ liệu không tự chuyển. Việc triển khai không xóa vùng lưu cũ.

1. Mở đúng bản website đang có dữ liệu bằng đúng trình duyệt hiện tại.
2. Ở vai trò tổ trưởng, vào **Dữ liệu & năm học → Tải bản sao lưu**.
3. Giữ tệp JSON ở nơi riêng do nhà trường quản lý. Không đưa tệp này lên repository.
4. Sau khi mở địa chỉ GitHub Pages, nếu tiếp tục dùng **chế độ mẫu**, có thể vào **Phục hồi bản sao lưu** để nhập tệp đó. Kiểm tra năm học, số học sinh và điểm sau phục hồi.
5. Bản mẫu phục hồi bằng cách thay thế trạng thái demo trên địa chỉ đích. Nếu địa chỉ đích đã có dữ liệu cần giữ, sao lưu địa chỉ đích trước; không phục hồi mù lên dữ liệu mới hơn. Không bấm **Khôi phục dữ liệu mẫu ban đầu** khi muốn giữ dữ liệu.

Nếu đang dùng Supabase: giữ nguyên URL và publishable/anon key thì địa chỉ mới vẫn truy cập cùng cơ sở dữ liệu, theo cùng quyền tài khoản. Cần đăng nhập lại. Không chạy lại schema.sql và không nhập lại dữ liệu để triển khai giao diện. Xem HUONG_DAN.md về giới hạn phục hồi; bản sao lưu demo không được dùng để nhập vào Supabase thật.

## Cách 1 — tự động kiểm tra, build và triển khai

### Bước 1 — chuẩn bị thư mục

Giải nén bộ **Website_QLCL_GitHub_Pages.zip**. Mở thư mục `Website_QLCL_To_Toan` bên trong.

Các tệp `package.json`, `index.html`, `app.js`, `config.js` và các thư mục `tools`, `tests`, `.github` phải nằm trực tiếp tại thư mục gốc repository. Không chỉ upload file ZIP: GitHub không tự giải nén nó để chạy website.

Nếu dùng cấu trúc workspace hiện tại, có thể giữ thư mục `toan-qlcl` làm thư mục con, nhưng workflow phải nằm ở `.github/workflows/pages.yml` tại gốc repository. Đã chuẩn bị cả bản workflow ở gốc workspace và bản nằm trong dự án. Workflow tự nhận diện hai cấu trúc này; chỉ bản ở gốc repository được GitHub chạy.

### Bước 2 — tạo hoặc mở repository

1. Đăng nhập GitHub.
2. Tạo repository, ví dụ `Math.p1` hoặc `toan-qlcl`. Hoặc mở repository đã có.
3. Chọn khả năng hiển thị phù hợp. GitHub Pages cho repo riêng phụ thuộc gói GitHub; repo công khai làm mã nguồn công khai. Không đưa bảng điểm, danh sách học sinh, bản sao lưu hay secret key vào bất kỳ bản công khai nào.
4. Dùng nhánh `main`. Nếu repository dùng nhánh khác, sửa `branches: [main]` và điều kiện `refs/heads/main` trong workflow cho khớp trước khi triển khai.

### Bước 3 — đưa mã nguồn lên

Cách dễ bảo đảm thư mục ẩn `.github` được đưa lên là dùng **GitHub Desktop → Add local repository / Create repository** rồi chọn thư mục dự án, tạo commit và Publish/Push repository. Nếu chưa có GitHub Desktop, có thể dùng Git đã có trên máy:

```powershell
cd 'DUONG_DAN_THU_MUC_DU_AN'
git init
git branch -M main
git add .
git status
git commit -m "Prepare To Toan website for GitHub Pages"
git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_REPOSITORY.git
git push -u origin main
```

Các lệnh trên dành cho thư mục mới, repository mới chưa có lịch sử khác. Nếu đã có Git: bỏ `git init`, kiểm tra `git remote -v` và `git status` trước; không ghi đè origin, không force-push. Nếu kho từ xa đã có tệp, clone kho vào một thư mục mới rồi chép bổ sung các tệp dự án, so sánh từng tệp trùng tên và commit thay đổi bình thường.

Chỉ `git add .` khi đang đứng trong đúng thư mục dự án sạch. Nếu đưa cả workspace lên, đã có `.gitignore` ở gốc để loại `output/`. Thư mục `reference/` và `test-deps/` trong dự án cũng được loại qua `.gitignore`.

Nếu upload bằng website GitHub: dùng **Add file → Upload files** để đưa các tệp/thư mục mã nguồn lên gốc repository. Vì Windows thường bỏ qua thư mục ẩn khi chọn tệp, kiểm tra tab Code xem có đúng `.github/workflows/pages.yml` chưa. Nếu thiếu, chọn **Add file → Create new file**, đặt tên `.github/workflows/pages.yml`, chép nội dung tệp workflow được cung cấp và commit. Không tạo tệp ở `.github/.github/...`.

### Bước 4 — bật GitHub Pages

1. Vào repository → **Settings → Pages**.
2. Trong **Build and deployment → Source**, chọn **GitHub Actions**.
3. Kiểm tra **Settings → Actions → General** cho phép chạy các actions sử dụng trong workflow. Nếu repository do tổ chức quản lý, chính sách có thể cần quản trị viên tổ chức cho phép.
4. Không cần tạo repository secret cho bước build bản mẫu. `GITHUB_TOKEN` của workflow được GitHub cấp tự động; không đặt token cá nhân vào code.

### Bước 5 — chạy triển khai

1. Vào tab **Actions → Build and deploy GitHub Pages**.
2. Chọn **Run workflow**, chọn nhánh `main`, bấm chạy. Những lần push tiếp theo lên main sẽ tự chạy.
3. Chờ hai job **build** và **deploy** thành công.
4. Mở URL trong kết quả job deploy hoặc trong **Settings → Pages**.
5. Với kho `Math.p1`, địa chỉ thường là `https://TEN_TAI_KHOAN.github.io/Math.p1/`. Địa chỉ chính xác là URL GitHub trả về; tên kho có phân biệt chữ hoa/thường.

### Bước 6 — kiểm tra sau triển khai

- Mở trang và mở lại cùng URL sau khi tải lại trình duyệt.
- Kiểm tra chọn năm học, khối, bài; chuyển các mục trong menu.
- Thử nhập vài dòng dữ liệu GIẢ, có điểm 0 và ô trống; thử xuất Excel.
- Trước khi phục hồi dữ liệu đang dùng, sao lưu cả nguồn và đích.
- Nếu dùng Supabase thật, kiểm tra hai giáo viên khác lớp và một tài khoản học sinh. Thêm URL Pages vào cấu hình Site URL/Redirect URLs của Supabase nếu dùng xác nhận email hoặc luồng khôi phục mật khẩu.
- Không chạy lại schema.sql chỉ vì đổi địa chỉ giao diện.

## Cách 2 — chỉ đăng bản HTML gộp, không dùng Actions

Nếu muốn ít bước, lấy **pages-dist/index.html** sau build hoặc tệp gộp `index.html` trong bộ đăng trang tĩnh riêng. Đưa tệp đó lên gốc repository, bật **Settings → Pages → Deploy from a branch → main → /(root)**.

Không upload `index.html` ở gốc dự án nguồn một mình: đó là bản nhiều tệp, cần `style.css`, `config.js`, `app.js`, `core.js`, `data.js`, `demo.js` đi kèm. Bản gộp mới chứa đủ giao diện trong một tệp.

Khi dùng cách này, không đồng thời bật workflow triển khai Actions cho cùng website. Nếu đổi từ cách này sang Actions, đổi Source thành GitHub Actions.

## Cấu hình Supabase khi đã có dự án

`config.js` hiện đang để trống nên bản build chạy chế độ mẫu. Khi có URL và publishable/anon key, điền vào config.js và push; workflow sẽ build lại. Không cần đổi base path khi repository đổi tên.

Không đặt `sb_secret_...` hoặc JWT `service_role` vào config.js. Công cụ kiểm tra trước triển khai từ chối hai loại này. Việc kiểm tra không thay thế kiểm tra quyền RLS trên dự án thật.

Nếu đang chạy bản gộp đã chỉnh cấu hình trực tiếp nhưng config.js nguồn chưa cập nhật, hãy đối chiếu và chuyển CHỈ URL/public key sang config.js trước build, để tránh build lại ra bản cấu hình trống. Công cụ chuẩn bị không tự chép cấu hình hoặc thay đổi bản gộp cũ.

## Lỗi triển khai thường gặp

| Hiện tượng | Kiểm tra và xử lý |
|---|---|
| Trang 404 | Pages Source đúng phương thức chưa; nhánh main; job deploy thành công; tên kho trong URL chính xác; index.html ở gốc artifact |
| Không có workflow trong Actions | `.github/workflows/pages.yml` phải ở gốc repository, không nằm dưới thư mục con |
| Build báo Website project not found | Dùng một trong hai cấu trúc được hướng dẫn; không đặt thêm nhiều cấp thư mục lồng nhau |
| Deploy báo Pages chưa được bật | Settings → Pages → Source: GitHub Actions, rồi chạy lại workflow |
| Deploy bị từ chối quyền | Kiểm tra pages:write, id-token:write, môi trường github-pages và chính sách Actions của tổ chức |
| Nhánh bị chặn bởi environment | Settings → Environments → github-pages → chỉ cho nhánh được phép; giữ nhánh main khớp workflow |
| CSS/JS 404 hoặc trang trống | Đang đưa nhầm bản index.html nguồn lên một mình; dùng artifact pages-dist hoặc đủ các tệp nguồn |
| Đường dẫn dưới /TEN_KHO/ lỗi | Không dùng `/assets/...`, base URL hoặc router yêu cầu máy chủ. Bản gộp hiện không có các phụ thuộc này |
| Bản mới không hiện ngay | Chờ Actions hoàn tất, kiểm tra đúng URL, tải lại mạnh Ctrl+F5; không reset dữ liệu mẫu |
| Mở địa chỉ mới không thấy dữ liệu cũ | localStorage theo địa chỉ trình duyệt; dữ liệu nguồn vẫn ở địa chỉ cũ. Sao lưu/phục hồi hoặc kết nối cùng Supabase |
| Login bị vô hiệu hóa | Cấu hình Supabase trống; bản hiện tại chạy mẫu. Đây không phải lỗi GitHub Pages |
| Excel hoặc đăng nhập không tải thư viện | Kiểm tra mạng/chặn CDN. Excel có CSV thay thế; Supabase cần esm.sh và tên miền dự án truy cập được |
| Đăng nhập được nhưng không thấy lớp | Kiểm tra profiles.active, role, phân công, năm học, học kỳ và các chính sách RLS |

Không thêm trang 404 tự động reset ứng dụng hoặc script xóa localStorage để chữa lỗi đường dẫn. Website hiện chuyển mục bằng JavaScript trong cùng trang, không dùng đường dẫn SPA cần rewrite.

## Tài liệu chính thức đã đối chiếu

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Lần chuẩn bị này chỉ thay cấu hình build/kiểm tra, thêm workflow và tài liệu; chưa push repository và chưa triển khai website công khai.
