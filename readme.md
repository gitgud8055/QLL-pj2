# Quản lý lịch

## Giới thiệu
- Trang web này dùng để tạo và quản lý lịch hẹn của cá nhân, cũng như lịch hẹn giữa sinh viên và giảng viên.
- Lần sửa đổi cuối: 6/4/2024

## Cách host trang web
- Tải Nodejs và npm (nếu chưa có)
- Clone lại trang Github này
- Tải các module cần thiết:
```
npm install ejs, express, multer, npm-run-all, tailwindcss, nodemon, sqlite, express-session
```
- Sau khi tải xong, sử dụng lệnh:
```
npm run dev
```
- Truy cập localhost:5000 để trải nghiệm

## Giao diện trang
### 1. Login
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/91c38a66-10fd-4837-9d0f-34e296bdf2f6)
- User sử dụng tài khoản và mật khẩu được cấp để đăng nhập
- Click vào mục Show password để hiện thị mật khẩu dưới dạng kí tự (như trong hình)

### 2. Trang chủ
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/b50c89fb-27d5-46c6-9e6a-3d6cc328a095)
- Đây là trang quản lý lịch của cá nhân
- Trang sẽ xuất hiện sau khi đăng nhập thành công hoặc click vào phần "Quản lý lịch" ở góc trên trái trang web.
- Lịch sẽ hiển thị theo từng tháng, những ngày được khoanh đỏ là những ngày user đã đặt lịch. Có thể xem được lịch của các tháng khác bằng cách ấn vào nút mũi tên để chuyển giữa các tháng
- Nội dung thông tin:
  - 9/4/2024: Những thông tin hiển thị bên dưới là lịch của ngày 9/4/2024
  - 03:43 - 21:43 : Thời điểm bắt đầu và kết thúc lịch trình
  - Nút + : Thêm lịch trình mới
  - Nút hình cây bút: Sửa đổi lịch trình đã có
- Chú ý: Độ dài phần nội dung sẽ bị cắt đi nếu quá dài. Tuy nhiên, user vẫn có thể xem được nội dung đầy đủ trong phần "sửa đổi lịch trình đã có"
  
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/4f058742-d9c8-44c1-a063-53f49d5905fe)
- Thông tin lịch bao gồm:
  - Ngày đặt lịch
  - Thời điểm bắt đầu
  - Thời điểm kết thúc
  - Nội dung lịch trình
  - Những file đã được đính kèm trước đó (có thể tải về bằng cách ấn vào file tương ứng để xem)
  - Thêm file mới (nếu cần)
- Nếu phía server gặp vấn đề hoặc user đưa ra thông tin không hợp lệ, user sẽ nhận được báo lỗi tương ứng

### 3. Quản lý thông tin cá nhân
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/1acd4170-f4fd-4460-8266-dd6618828644)
- Click vào avatar của user ở góc trên phải trang web, một popup sẽ hiện ra
- Đăng xuất: Thoát khỏi account hiện tại

![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/459ad274-8146-4f14-9aac-e8585b49666b)
- Đổi mật khẩu: Xuất hiện bảng cập nhật mật khẩu, yêu cầu những thông tin sau
  - Mật khẩu hiện tại 
  - Mật khẩu mới
  - Xác nhận (để chắc chắn mật khẩu không bị viết sai)
  
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/11c41785-9cbf-456c-be35-6e7411257f1b)
- Quản lý thông tin cá nhân: User sẽ được chuyển đến phần thông tin cá nhân. Tại đây, user có thể sửa đổi bất cứ thông tin cá nhân nào (bao gồm ảnh đại diện, tên, sdt, ...) và ấn vào nút Save để lưu lại những thay đổi
- Chú ý: user phải ấn vào biểu tượng hình cây bút để có thể sửa đổi được thông tin. Ấn thêm 1 lần nữa để hủy bỏ thay đổi

### 4. Quản lý lịch hẹn
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/333ff4ed-d6c2-450b-9b11-2519474bc209)
- Click vào phần "Danh sách cuộc hẹn"
- Có 5 mục lần lượt:
  - Thông tin lịch hẹn: Chứa nội dung của cuộc hẹn
  - Lịch hẹn đã gửi: Danh sách những user đã nhận được lịch hẹn từ user hiện tại (kiếm tra trạng thái đặt lịch và thời gian)
  - Lịch hẹn đã nhận: Danh sách những user đã gửi lịch hẹn đến cho user hiện tại (chọn lịch gặp mặt)
  - Đặt lịch hẹn: Tạo lịch hẹn mới và gửi cho một số user được chọn (chọn trong "danh sách sinh viên/ giảng viên")
  - Danh sách giảng viên/ sinh viên: Thông tin những sinh viên/ giảng viên có liên quan
### 4.1 Thông tin lịch hẹn:
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/4847b941-b5fd-4c0d-aa63-ed323c442285)
- Bao gồm: mã cuộc hẹn, chủ cuộc hẹn, ID người chủ, ghi chú.
- Click vào phần "Detail" để xem thông tin chi tiết cũng như sửa đổi nội dung.
  
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/1de54b4a-cfb6-4054-812e-61419a5724bf)
- Thông tin chi tiết bao gồm: Những thời gian mà chủ cuộc hẹn rảnh, nội dung, file đính kèm (có thể tải về để xem)
- Chỉ có chủ cuộc hẹn mới có quyền sửa đổi nội dung cuộc hẹn

### 4.2 Lịch hẹn đã gửi
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/368d4f3a-e1e1-424b-bac6-b5da7eaddeb0)
- Nếu user nào chưa quyết định lịch hẹn thì ô "thời điểm bắt đầu" và "thời điểm kết thúc" sẽ được bỏ trống

### 4.3 Lịch hẹn đã nhận
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/b72e6965-1741-4b5e-ac59-565cd6d540db)
- Click vào nút "Chọn" để có thể lựa chọn thời gian gặp mặt
- Sau đó, user có thể sửa đổi "Thời điểm bắt đầu" và "Thời điểm kết thúc"
- Click vào nút "OK" để lưu những thay đổi (sẽ nhận được thông báo nếu thay đổi thành công)

### 4.4 Đặt lịch hẹn
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/c46a1597-57ed-483e-8a23-e9b5f0543883)
- Thời điểm bắt đầu - kết thúc: Những thời gian rảnh của user có thể đặt lịch. Nếu có nhiều khoảng thời gian rảnh, thêm bằng cách click vào nút +. Còn nếu như viết sai, có thể ấn vào nút "thùng rác" để loại bỏ
- Nội dung: thông báo đến cho những user được chọn
- File đính kèm: thêm những file cần thiết trước cuộc gặp mặt
- Danh sách user gửi đến: Chọn trong danh sách ở mục 4.5
- Click vào nút "Done" để xác nhận lịch, hệ thống sẽ thông báo nếu có lỗi phát sinh

### 4.5 Danh sách sinh viên/ giảng viên
![image](https://github.com/gitgud8055/QLL-pj2/assets/151536929/a5b4a2e4-dacb-4e46-997d-6e94e42f55a7)
- Click vào phần tên sinh viên/ giảng viên để xem thông tin chi tiết
- User sẽ chọn những user để gửi lịch hẹn đi bằng cách click vào hàng của user tương ứng. Khi đó, hàng của user được gửi đi sẽ được highlight màu xanh blue (như trong hình). Click vào hàng những user đó một lần nữa để hủy
- Để giảm thiểu thời gian chọn lọc user, trang web cung cấp phím tắt "Shift". Khi bấm "Shift", tất cả những hàng khi di chuột qua sẽ được chọn. Bấm "Shift" một lần nữa để hủy bỏ mode này.





