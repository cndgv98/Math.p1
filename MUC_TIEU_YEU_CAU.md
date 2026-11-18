# Mục tiêu và yêu cầu chuẩn

Nguồn: bản Promp_gop_y.docx do người dùng cung cấp tại D:/ĐTĐ/Tài liệu soạn 26-27/SP NV Tổ/QLCL/Promp_gop_y.docx, đọc và thống nhất trong cuộc trao đổi ngày 18/11/2026. Tệp này lưu yêu cầu để tiếp tục sửa code mà không phụ thuộc vào lịch sử chat.

## Mục tiêu

Website quản lý chất lượng môn Toán cho THPT Đoàn Thị Điểm – Hà Nội, phục vụ tổ trưởng. Theo dõi kết quả và sự tiến bộ từng học sinh, từng lớp; thang điểm 10. Quy mô thiết kế tối thiểu 25 giáo viên, 50 lớp, 2.000 học sinh. Dùng mã học sinh của trường. Nhập/xuất Excel theo toàn trường, từng khối, từng lớp, từng học sinh, đúng quyền truy cập.

## Quyền truy cập

- Tổ trưởng/admin: quản lý các lớp, tài khoản giáo viên và học sinh; thay đổi quyền; kiểm tra và sửa điểm; phân theo năm học, học kỳ.
- Mọi lần sửa điểm lưu người sửa, thời gian, giá trị trước/sau và đánh dấu đỏ bản ghi đã sửa.
- Giáo viên: chi tiết và thao tác tại lớp được phân công; chỉ xem thống kê tổng hợp lớp khác, khối và trường. Kiểm soát cả API, đường dẫn và dữ liệu xuất.
- Bản triển khai chọn quyền học sinh tối thiểu: chỉ xem và xuất hồ sơ chính mình. Đây là quyết định triển khai vì tài liệu gốc chưa xác định quyền tài khoản học sinh.

## Dữ liệu học tập

- Admin nhập một lần bài định kỳ/khảo sát chung toàn khối; điểm theo mã học sinh tự được dùng ở từng lớp.
- Giáo viên nhập KTTX riêng lớp; có thống kê riêng, điểm trung bình và phân bố điểm.
- Nhập trực tiếp hoặc Excel, có kiểm tra lỗi và xem trước.
- Phân loại theo ngưỡng đạt của bài/lớp; tách khỏi nhóm tương đối bằng tứ phân vị mẫu ghép nhóm.
- Gợi ý 4 nhóm khoảng 25%; bản triển khai bổ sung tùy chọn chia gần đều theo thứ tự, công khai việc xử lý học sinh đồng điểm.
- Màu và nhãn rõ ràng; cảnh báo cần theo dõi, cần hỗ trợ, có dấu hiệu giảm kết quả; giáo viên xác nhận và ghi biện pháp, thời gian xem lại, kết quả.
- Không kết luận học sinh sa sút chỉ từ một bài.

## Tổng quan và báo cáo

- Tổng quan theo khối, đợt kiểm tra; bộ lọc năm học, học kỳ.
- Tổ trưởng xem tình trạng nộp/đủ điểm và cảnh báo chưa xử lý. Phiên bản này chỉ xác định đủ/chưa đủ điểm, chưa có quy trình ký duyệt/nộp riêng.
- Báo cáo Excel và bản in theo quyền.
- So sánh điểm trung bình, nhóm điểm và tiến trình các lớp qua bài chung; xác định rõ các đại lượng của tương quan và không suy diễn nguyên nhân.
- Chỉ xếp hạng cùng khối, cùng bài chung; đồng hạng khi bằng điểm gốc; dữ liệu thiếu ghi tạm thời; hiển thị tỷ lệ có điểm và tỷ lệ đạt.
- Không xếp hạng chung khối 10, 11, 12 bằng điểm thô.

## Qua năm học

- Sao lưu dữ liệu năm học. Khối 12 kết thúc khóa, giữ lịch sử; khối 10–11 chuyển khối để quản lý tiếp.
- Quyền xem năm trước theo lớp giáo viên từng được phân công, có thể thu hồi khi cần.
- Bản hiện tại cung cấp sao lưu thủ công và chuyển năm học. Sao lưu tự động hạ tầng cần thiết lập ở dịch vụ dữ liệu.

## Phạm vi và trạng thái

- Đã có code giao diện, bản một tệp để xem thử, schema/RLS/RPC, hàm cấp tài khoản và hướng dẫn.
- Chưa tạo hoặc kết nối dự án Supabase thật. Chưa đăng lên GitHub theo yêu cầu mới nhất: người dùng tự đưa code lên sau.
- Chưa có dữ liệu học sinh thật, tài khoản thật, hoặc kết quả kiểm thử đăng nhập trực tuyến.
- Phân tích điểm theo từng câu/chủ đề, lịch sử chuyển lớp giữa năm, tùy biến quy tắc cảnh báo qua giao diện và đối chiếu các đề khác độ khó là phạm vi mở rộng; không được trình bày là đã hoàn thiện.
