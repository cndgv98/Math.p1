# Website quản lý chất lượng Tổ Toán

THPT Đoàn Thị Điểm – Hà Nội. Bản mã nguồn theo yêu cầu đã thống nhất ngày 18/11/2026.

## Bắt đầu nhanh

1. Mở **dist/index.html** trong Chrome hoặc Edge. Đây là bản gộp một tệp, không cần cài Node.js để xem thử.
2. Chọn vai trò **Tổ trưởng**, **Giáo viên bộ môn** hoặc **Học sinh**, rồi bấm **Mở không gian mẫu**.
3. Bản mẫu có 216 học sinh giả lập, 9 lớp, các bài chung và KTTX. Đây là số liệu để thử giao diện; không phải giới hạn hệ thống.
4. Dữ liệu mẫu được lưu trong trình duyệt đang dùng, không đồng bộ sang máy khác. Không nhập điểm học sinh thật ở chế độ mẫu.

Nếu trình duyệt hạn chế việc mở tệp trực tiếp, dùng GitHub Pages theo phần dưới, hoặc chạy `npm run preview` khi đã có Node.js. Mở địa chỉ `http://127.0.0.1:4173` mà lệnh in ra.

## Đưa bản một tệp lên GitHub Pages

1. Tạo hoặc mở repository trên GitHub.
2. Tải **tệp index.html nằm BÊN TRONG thư mục dist** lên thư mục gốc của repository. Không tải thư mục dist thành một cấp con nếu muốn trang ở địa chỉ gốc.
3. Vào **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
4. Chọn nhánh `main`, thư mục `/(root)`, bấm Save.
5. Chờ GitHub thông báo địa chỉ trang. Địa chỉ thường có dạng `https://TEN-TAI-KHOAN.github.io/TEN-KHO/`.

Cách khác dành cho người sửa code: đưa các tệp index.html, config.js, style.css, app.js, core.js, data.js, demo.js và .nojekyll ở thư mục gốc lên repository. Bản nhiều tệp thuận tiện chỉnh sửa; bản dist thuận tiện đưa lên web. Chọn một cách để tránh nhầm bản đang chạy.

GitHub Pages chỉ chạy giao diện. Cần hoàn thành thiết lập Supabase để đăng nhập thật và đồng bộ điểm của nhiều giáo viên. Không đưa bản sao lưu, bảng điểm hay danh sách học sinh lên repository công khai.

## Kích hoạt tài khoản và dữ liệu thật bằng Supabase

### 1. Tạo cơ sở dữ liệu

- Tạo một dự án Supabase do nhà trường quản lý. Ghi lại URL dự án và publishable key hoặc anon key.
- Trong SQL Editor, mở và chạy **backend/schema.sql** đúng một lần trên dự án mới. Tệp tạo các bảng, chính sách phân quyền, hàm nhập điểm, báo cáo tổng hợp, lịch sử sửa, chuyển năm học và phục hồi.
- Không chạy lại schema.sql vào dự án đã có bảng. Khi sửa hệ thống đã vận hành cần dùng migration riêng và sao lưu trước.
- Trong Authentication, tắt đăng ký công khai nếu chỉ cho admin cấp tài khoản. Bật các chính sách mật khẩu phù hợp của nhà trường.

### 2. Tạo tài khoản tổ trưởng đầu tiên

- Trong **Authentication → Users**, tạo tài khoản của tổ trưởng. Xác nhận email theo cấu hình dự án; không đặt mật khẩu vào mã nguồn.
- Sau khi tài khoản Auth đã có, chạy SQL dưới đây. Thay email và họ tên bằng thông tin thật:

```sql
insert into public.profiles(id, name, email, role, active)
select id, 'Họ tên tổ trưởng', email, 'admin', true
from auth.users
where email = 'EMAIL_TO_TRUONG';
```

Chỉ tài khoản có bản ghi profiles hoạt động mới truy cập được dữ liệu. Giao diện không cho tự hạ quyền hoặc khóa tài khoản admin đang đăng nhập.

### 3. Cấu hình giao diện

Sửa **config.js** ở bản nhiều tệp:

```js
window.APP_CONFIG = {
  supabaseUrl: 'https://MA-DU-AN.supabase.co',
  supabaseKey: 'PUBLISHABLE_KEY_HOAC_ANON_KEY'
};
```

Hai thông tin này dành cho trình duyệt. **Không dùng secret key hoặc service_role key.** Các quyền được bảo vệ bởi đăng nhập và chính sách RLS trong cơ sở dữ liệu.

Nếu dùng bản một tệp: mở **dist/index.html** bằng trình soạn thảo, tìm `window.APP_CONFIG` và điền hai giá trị ngay tại đó. Hoặc sửa config.js rồi chạy `node tools/build-single.mjs` để tạo lại bản gộp. Sau đó tải lại index.html lên GitHub.

### 4. Bật chức năng admin cấp tài khoản

Tạo Supabase Edge Function tên **manage-users** từ **backend/functions/manage-users/index.ts**. Có thể triển khai qua Dashboard hoặc Supabase CLI. Hàm dùng biến môi trường máy chủ `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` của dự án.

Hàm tự xác minh JWT bằng `auth.getUser()` và kiểm tra tài khoản admin đang hoạt động trong profiles trước khi gọi API quản trị. Không thay nó bằng thao tác gọi createUser với service_role từ trình duyệt.

Nếu triển khai bằng CLI:

```text
supabase login
supabase link --project-ref MA-DU-AN
supabase functions deploy manage-users
```

Lưu ý thư mục mã nguồn hàm mặc định của CLI là `supabase/functions/manage-users/index.ts`; sao chép tệp được cung cấp vào đúng đường dẫn đó trước khi chạy. Với cấu hình xác minh JWT mới của dự án, nếu cổng hàm từ chối JWT hợp lệ, kiểm tra tài liệu Supabase và giữ bước xác minh `getUser` bên trong hàm; không bỏ kiểm tra quyền admin.

### 5. Nhập dữ liệu ban đầu

1. Đăng nhập tài khoản tổ trưởng.
2. Vào **Hồ sơ học sinh → Thêm lớp**; tạo các lớp theo từng khối, đúng năm học.
3. Chọn **Nhập danh sách học sinh** với các cột `MaHS, HoTen, Lop`. Tên lớp phải có sẵn. MaHS nên lưu dạng Text trong Excel để giữ số 0 đầu; phần mềm không thể khôi phục số 0 đã bị Excel làm mất.
4. Vào **Tài khoản & phân công** để cấp tài khoản và phân công lớp. Với học sinh, bắt buộc liên kết đúng mã học sinh; quyền mặc định chỉ xem hồ sơ bản thân.
5. Vào **Bài kiểm tra → Tạo bài kiểm tra**, chọn bài chung hoặc KTTX.
6. Bài chung do tổ trưởng nhập một lần; giáo viên thấy điểm của lớp phụ trách mà không cần nhập lại.

## Nhập và sửa điểm

- Dùng **Tải mẫu điểm** để lấy đúng mã trong phạm vi đang chọn. MaHS và Diem là cột bắt buộc; có thể thêm TrangThai và NhanXet.
- `scored`: có điểm; `missing`: chưa nhập; `absent`: vắng thi; `exempt`: miễn kiểm tra; `makeup`: chờ kiểm tra bù.
- Điểm 0 là điểm thật. Ô trống chuyển thành missing, không chuyển thành 0. Điểm nhập có tối đa hai chữ số thập phân, từ 0 đến 10.
- Nếu dùng tệp mẫu có TrangThai=missing, cần đổi thành scored cho dòng đã có điểm. Trạng thái không phải scored sẽ giữ giá trị điểm là rỗng.
- Tệp có lỗi sẽ không được xác nhận nhập. Xem lại mã trùng, điểm ngoài thang, mã không thuộc lớp/khối.
- Xem trước thay đổi trước khi xác nhận. Dòng không có trong tệp giữ nguyên dữ liệu cũ.
- Nhập thủ công tại **Lớp học & bảng điểm** rồi bấm **Lưu thay đổi**. Giáo viên chỉ sửa KTTX của lớp được giao; bài chung do tổ trưởng quản lý.
- Khi có người khác sửa trước, máy chủ từ chối phiên bản cũ; tải lại trang để xem số mới rồi nhập lại.
- Tổ trưởng có thể khóa/mở khóa bài. Nhật ký chỉ đọc lưu điểm, trạng thái, nhận xét trước/sau và người sửa. Màu đỏ đánh dấu bản ghi từng được chỉnh sửa; đây không phải chế độ so sánh riêng từng ký tự.

## Diễn giải thống kê

- Điểm trung bình, trung vị, độ lệch chuẩn và tỷ lệ đạt chỉ tính trên học sinh có điểm. Có điểm bằng 0 vẫn được tính.
- Tỷ lệ có điểm/tham dự hiển thị là số học sinh có điểm chia số học sinh trong danh sách, gồm cả những trường hợp miễn hoặc chờ bù trong mẫu số. Cần xem trạng thái trước khi diễn giải; đây không phải tỷ lệ chuyên cần.
- Ngưỡng đạt có mặc định theo bài và có thể đặt riêng cho lớp. Với bài chung, tổ trưởng quản lý ngưỡng. Báo cáo nhóm điểm cố định dùng dưới 5; 5–dưới 6,5; 6,5–dưới 8; 8–10, tách biệt với ngưỡng đạt tùy chỉnh.
- Xếp hạng cạnh tranh theo điểm trung bình chưa làm tròn, ví dụ 1, 1, 3. Chênh lệch nhỏ có thể khiến số hiển thị hai chữ số bằng nhau nhưng hạng khác; xuất Excel có số gốc. Không xếp hạng giữa các khối hoặc giữa các bài riêng lớp.
- Xu hướng chỉ tổng hợp bài chung trong cùng `Nhóm so sánh`. Giáo viên phải xác nhận tính tương đồng của đề; đường biểu diễn không tự xác nhận tiến bộ về năng lực.
- Biểu đồ tương quan dùng điểm trung bình và tỷ lệ đạt của các lớp; không suy ra nguyên nhân hay hiệu quả giảng dạy.

### Phân nhóm và trường hợp bằng điểm

Trong bảng điểm có ba cách chia, đều là gợi ý vị trí tương đối:

1. **Tứ phân vị mẫu ghép nhóm:** nội suy trên các khoảng [0;2), [2;4), [4;6), [6;8), [8;10]. Đây là cách mặc định theo tài liệu yêu cầu.
2. **Tứ phân vị điểm gốc:** nội suy trực tiếp từ danh sách điểm.
3. **Chia 4 nhóm gần 25% theo thứ tự:** sắp điểm tăng dần, đồng điểm xếp theo mã học sinh; số lượng các nhóm chênh tối đa 1. Cách này có thể tách học sinh cùng điểm.

Hai cách tứ phân vị giữ học sinh bằng điểm cùng nhóm, nên không cam kết mỗi nhóm đúng 25%. Không gắn nhãn học lực tốt/kém chỉ dựa trên nhóm này. Khi chưa có dữ liệu, mốc hiện dấu gạch.

## Cảnh báo và hỗ trợ

Quy tắc ban đầu: chưa đạt ngưỡng hai bài chung liên tiếp; giảm từ 2 điểm ở hai bài chung cùng nhóm so sánh; hoặc thiếu kết quả bài chung gần nhất. Quy tắc hiện áp dụng cho chuỗi bài chung, chưa phân tích tự động các chuỗi KTTX khác đề.

Giáo viên xác nhận cần theo dõi, cần hỗ trợ, không cần hỗ trợ hoặc đã xem lại; ghi biện pháp, ngày kiểm tra lại và kết quả. Lịch sử vẫn tồn tại khi học sinh không còn phát sinh tín hiệu cảnh báo.

## Năm học và quyền xem lịch sử

- Giáo viên xem năm trước theo lớp **từng được phân công**, không tự được xem toàn bộ lịch sử của mọi học sinh hiện đang phụ trách. Tổ trưởng xem toàn bộ.
- Tổ trưởng có thể thu hồi/cấp lại phân công. Thu hồi là dừng quyền truy cập lớp đó, kể cả lịch sử của lớp. Nếu cần giữ quyền xem lịch sử, giữ phân công năm cũ và chỉ thay phân công năm mới.
- Chuyển năm học tải sao lưu trước, lưu trữ năm nguồn, tạo lớp khối kế tiếp và chuyển danh sách khối 10–11. Khối 12 ở lại năm nguồn để tra cứu toàn khóa.
- Chưa tự xử lý lưu ban, chuyển trường, tách/gộp lớp. Tổ trưởng rà soát lại danh sách năm mới trước khi nhập điểm.
- Chuyển lớp bằng tệp danh sách sẽ cập nhật lớp trong năm. Phiên bản này chưa lưu các giai đoạn chuyển lớp giữa năm; nếu nhà trường cần tra cứu chính xác theo từng thời điểm chuyển lớp, cần bổ sung lịch sử ghi danh trước khi vận hành quy trình này.

## Sao lưu và phục hồi

- Sao lưu trong giao diện là **tệp JSON tải thủ công** các bảng nghiệp vụ được phép đọc; không chứa mật khẩu, tài khoản Supabase Auth hay cấu hình hạ tầng. Admin có thể sao lưu toàn trường.
- Để sao lưu tự động hằng ngày và bảo vệ trường hợp mất dự án, cấu hình chính sách backup ngoài ứng dụng theo dịch vụ Supabase/nhà trường. Chưa có lịch sao lưu tự động trong mã nguồn này.
- Phục hồi là **hợp nhất theo mã bản ghi trong cùng dự án**, không xóa dữ liệu ngoài bản sao lưu và không xóa nhật ký hiện tại. Các sửa điểm trong quá trình phục hồi được ghi nhật ký. Không dùng tệp giả lập để phục hồi vào dữ liệu thật.
- Phục hồi sang dự án Supabase khác đòi hỏi phục hồi Auth và đối chiếu UUID tài khoản trước. Chức năng phục hồi giao diện không thay thế quy trình phục hồi toàn bộ hạ tầng.

## Cấu trúc bộ code

```text
dist/index.html                 Bản gộp một tệp, mở thử hoặc tải lên GitHub
index.html, style.css, app.js    Giao diện và các luồng thao tác
core.js                         Quy tắc điểm, thống kê, nhập liệu
data.js                         Kết nối Supabase và dữ liệu mẫu
demo.js                         Sinh dữ liệu học sinh giả lập
config.js                       Điền URL và publishable/anon key
backend/schema.sql              Cơ sở dữ liệu, RLS, RPC, lịch sử sửa
backend/functions/manage-users  Hàm máy chủ cấp tài khoản
tests/core.test.mjs              Kiểm tra quy tắc điểm và thống kê
tools/test-backend.mjs           Kiểm tra PostgreSQL/RLS bằng PGlite
tools/build-single.mjs           Gộp giao diện thành dist/index.html
MUC_TIEU_YEU_CAU.md              Yêu cầu chuẩn và các quyết định triển khai
KIEM_THU.md                     Kết quả kiểm tra và giới hạn xác minh
```

Không cần cài thư viện để chạy bản mẫu trong trình duyệt. Excel tải thư viện SheetJS từ CDN khi sử dụng; nếu không tải được, xuất báo cáo chuyển sang CSV và nhập có thể dùng CSV/dán bảng. Đăng nhập thật tải Supabase JS từ CDN. Phông chữ có Arial dự phòng khi không có mạng.

Để chạy kiểm tra khi có Node.js:

```text
npm install
npm test
npm run test:backend
npm run preview
```

Thư viện PGlite chỉ phục vụ kiểm thử, không phải cơ sở dữ liệu chạy trên website. Trước khi dùng thật, cần kiểm tra lại Supabase Auth, Edge Function và quyền truy cập trên dự án thực tế với ít nhất hai tài khoản giáo viên.

## Tài liệu nền tảng

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase quản lý tài khoản: https://supabase.com/docs/reference/javascript/auth-admin-createuser

Mẫu giáo viên chủ nhiệm được dùng làm tham chiếu về bố cục quản lý, biểu mẫu và nhập/xuất Excel. Các phần điểm danh, thi đua, trực nhật, mật khẩu cố định trong code và lưu trữ trình duyệt cho dữ liệu thật đã được thay bằng luồng quản lý điểm môn Toán và phần cơ sở dữ liệu dùng chung.
