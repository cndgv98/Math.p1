# Kết quả kiểm tra

Ngày kiểm tra: 18/11/2026. Không sử dụng dữ liệu học sinh thật.

## Đã thực hiện

- Kiểm tra cú pháp các mô-đun JavaScript bằng Node.js.
- 8 phép thử quy tắc điểm và thống kê đều đạt: giữ điểm 0, phân biệt ô trống và vắng thi; kiểm tra khoảng và định dạng điểm; mã trùng/mã ngoài phạm vi; trung bình, tỷ lệ có điểm; đồng hạng; đồng điểm tại tứ phân vị; CSV có dấu phẩy/dòng mới; tứ phân vị ghép nhóm; tương quan không xác định khi thiếu dữ liệu hoặc phương sai bằng 0.
- 23 kiểm tra cơ sở dữ liệu bằng PostgreSQL chạy cục bộ qua PGlite đều đạt. Bao gồm: tạo schema, nhập điểm admin, RLS giáo viên/học sinh, báo cáo tổng hợp lớp khác, từ chối ghi bài chung với giáo viên, chặn ghi thẳng bảng điểm, không tự nâng quyền, ghi KTTX đúng lớp, từ chối mã ngoài lớp và phiên bản cũ, bảng khóa, nhật ký không được xóa, một học sinh không có hai lớp cùng năm, từ chối điểm quá số chữ số, lỗi giữa lô làm hoàn tác toàn bộ lô, phục hồi có ngưỡng bài khóa, chuyển năm học, thu hồi phân công.
- Kiểm tra mô phỏng quy mô 25 giáo viên, 50 lớp, 2.000 học sinh và nhập 2.000 điểm bài chung; số lớp và số điểm tổng hợp khớp. Đây không phải cam kết thời gian đáp ứng trên máy chủ thực tế.
- Mở bản nhiều tệp và bản gộp dist/index.html trong trình duyệt. Điều hướng qua các màn hình tổng quan, lớp học, bài kiểm tra, nhập điểm, hồ sơ, hỗ trợ, báo cáo, tài khoản, nhật ký, năm học.
- Dán bảng có một điểm 0 và một ô trống; xem trước đúng trạng thái; xác nhận nhập và quan sát nhật ký trước/sau.
- Thử vai trò giáo viên: danh sách lớp chi tiết chỉ có lớp được phân công; điểm bài chung ở chế độ chỉ đọc.
- Thử vai trò học sinh trong bản mẫu: dữ liệu điểm cá nhân giới hạn một học sinh. Bản cuối chỉ giữ màn hình hồ sơ học sinh cho vai trò này.
- Khóa bảng điểm làm mất nút lưu, mở khóa cho phép sửa; lưu thủ công điểm 8,5 và đọc lại đúng.
- Tải thành công báo cáo .xlsx từ trình duyệt bằng SheetJS.
- Kiểm tra màn hình rộng và màn hình điện thoại; trang tổng quan không tràn ngang toàn trang. Các bảng chi tiết cho cuộn ngang trong vùng bảng.
- Lưu ảnh màn hình tổng quan và khôi phục dữ liệu mẫu sau thao tác kiểm tra.

## Chưa thể xác minh khi chưa có Supabase của nhà trường

- Đăng nhập Auth trực tuyến, cấu hình phiên/khôi phục email, cấp tài khoản qua Edge Function trên dự án thật.
- Cấu hình publishable key, URL trang và thiết lập email/Auth của dự án.
- Tải đồng thời nhiều giáo viên qua mạng thực tế, hạn mức và độ trễ dịch vụ.
- Khôi phục hạ tầng/Auth sang dự án khác, lịch sao lưu tự động và chính sách lưu giữ dữ liệu.
- Website công khai trên GitHub Pages: người dùng sẽ tự tải code lên, chưa triển khai trong lần làm này.

Trước khi sử dụng điểm thật, chạy lại kiểm tra phân quyền với hai giáo viên khác lớp và một học sinh trên dự án Supabase thực tế. Kiểm tra trực tiếp cả API và tệp xuất, không chỉ giao diện.
