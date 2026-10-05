# 🌍 Website Quản lý & Đặt Tour Du Lịch (OTA Platform)

> Nền tảng thương mại điện tử du lịch toàn diện, tự động hóa quy trình đặt chỗ và đối soát thanh toán dành cho khách cá nhân và doanh nghiệp.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Laravel](https://img.shields.io/badge/laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

## 📖 Giới thiệu (About)

Dự án **Website Quản lý & Đặt Tour Du Lịch** được phát triển nhằm số hóa toàn bộ quy trình phân phối tour của một Đại lý du lịch trực tuyến (OTA). Thay vì quản lý thủ công qua Excel hay Zalo, hệ thống mang đến giải pháp khép kín từ khâu khách hàng tìm kiếm, đặt chỗ (chống đụng độ dữ liệu thời gian thực), cho đến việc tự động xác nhận thanh toán qua Webhook ngân hàng. 

Hệ thống được thiết kế linh hoạt để phục vụ cả hai luồng nghiệp vụ cốt lõi: phân phối tour trọn gói cho **khách lẻ (B2C)** và tiếp nhận yêu cầu thiết kế tour riêng cho **khách doanh nghiệp (B2B)**.

## 💻 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng theo kiến trúc API-first, tách biệt hoàn toàn giữa Frontend và Backend:

**Frontend (Client & Admin/Staff Portal):**
- **Core:** ReactJS
- **Styling:** Bootstrap / Custom CSS
- **Routing:** React Router DOM

**Backend (RESTful API):**
- **Framework:** Laravel (PHP)
- **Database:** MySQL
- **Bảo mật:** Laravel Sanctum (Token-based Authentication), Role-based Access Control (RBAC).

**Dịch vụ tích hợp (Third-party Services):**
- **Thanh toán:** Cổng thanh toán SePay (Tích hợp Webhook tự động đối soát giao dịch 24/7).
- **Tiện ích:** Cronjobs (Tự động hủy đơn hàng chưa thanh toán, tự động nhân bản tour định kỳ).
- **Bảo toàn dữ liệu:** Database Transactions & `lockForUpdate` (Xử lý Race Condition).

## ✨ Tính năng nổi bật (Features)

Hệ thống được chia làm 3 phân hệ chính với các tính năng nghiệp vụ chuyên sâu:

**1. Phân hệ Khách hàng (Customer Portal):**
- **Tìm kiếm & Đặt tour (B2C):** Đặt tour trọn gói, xử lý đụng độ dữ liệu (Race Condition) đảm bảo không bán vượt quá số chỗ trống.
- **Yêu cầu Tour riêng (B2B):** Form điền yêu cầu thiết kế tour dành cho doanh nghiệp.
- **Thanh toán QR tự động:** Tích hợp API SePay, sinh mã QR động và tự động xác nhận đơn hàng ngay khi nhận được chuyển khoản.
- **Hủy tour & Hoàn tiền:** Giao diện cho phép khách hàng chủ động yêu cầu hủy tour dựa trên chính sách hoàn tiền theo thời gian quy định.

**2. Phân hệ Nhân viên (Staff/Admin Portal):**
- **Quản lý Tour:** Hỗ trợ tạo tour theo đợt và **Tour định kỳ** (Tự động nhân bản các tour gối đầu cho 4 tuần tiếp theo).
- **Quản lý Đơn hàng:** Xử lý đơn đặt chỗ, duyệt yêu cầu hủy tour, sinh mã QR hoàn tiền thủ công cho kế toán.
- **Xử lý luồng B2B:** Tiếp nhận yêu cầu doanh nghiệp, khóa quyền xử lý chéo (Nhân viên A không được can thiệp dữ liệu của Nhân viên B).
- **Thống kê & Báo cáo:** Dashboard doanh thu, số lượng đơn hàng, và tình trạng lấp đầy chỗ.

**3. Xử lý ngầm (Background Jobs):**
- `orders:cancel-unpaid`: Tự động hủy đơn hàng và nhả lại số chỗ (Restore seats) nếu khách không thanh toán sau 15 phút.
- `tour:generate-clones`: Chạy lúc 00:00 mỗi ngày để tự động sinh các tour định kỳ.

---

## 🛠️ Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Điều kiện tiên quyết (Prerequisites)
Đảm bảo máy tính của bạn đã cài đặt sẵn các phần mềm sau:
- **PHP** >= 8.1
- **Composer** (Quản lý thư viện PHP)
- **Node.js** >= 18.x & **npm/yarn**
- **MySQL** (XAMPP, Laragon, hoặc MySQL Server)

### 2. Cài đặt Backend (Laravel)

Di chuyển vào thư mục Backend và tiến hành cài đặt:

```bash
# 1. Di chuyển vào thư mục Backend
cd Backend

# 2. Cài đặt các thư viện PHP
composer install

# 3. Tạo file cấu hình môi trường
cp .env.example .env

# 4. Cấu hình Database trong file .env
# DB_DATABASE=ten_database_cua_ban
# DB_USERNAME=root
# DB_PASSWORD=

# 5. Tạo key bảo mật cho ứng dụng
php artisan key:generate

# 6. Chạy Migration và Seed (Tạo bảng và dữ liệu mẫu)
php artisan migrate --seed

# 7. Khởi chạy Server Backend
php artisan serve
# Backend sẽ chạy tại: http://localhost:8000

### 3. Cài đặt Frontend (ReactJS)

# 1. Di chuyển vào thư mục Frontend
cd Frontend
# 2. Cài đặt các thư viện Node.js
npm install
# 3. Khởi chạy server Frontend
npm run dev
# Frontend sẽ chạy tại: http://localhost:5173 (hoặc port tương ứng)

### 4. Khởi chạy Cronjobs & Queue
php artisan schedule:work

## 📸 Hình ảnh Minh họa (Screenshots)

*Dưới đây là một số hình ảnh giao diện thực tế của hệ thống:*

<details>
  <summary><b>1. Giao diện Trang chủ & Đặt Tour (Khách hàng)</b> <i>(Bấm để xem)</i></summary>
  
  ![Trang chủ Khách hàng](https://via.placeholder.com/800x400?text=Thay+link+anh+trang+chu+vao+day)
</details>

<details>
  <summary><b>2. Giao diện Thanh toán QR Code tự động</b> <i>(Bấm để xem)</i></summary>
  
  ![Thanh toán SePay](https://via.placeholder.com/800x400?text=Thay+link+anh+thanh+toan+vao+day)
</details>

<details>
  <summary><b>3. Dashboard Quản trị & Điều hành (Admin/Staff)</b> <i>(Bấm để xem)</i></summary>
  
  ![Dashboard Quản trị](https://via.placeholder.com/800x400?text=Thay+link+anh+dashboard+vao+day)
</details>

*(Mẹo: Bạn có thể thay thế các link `https://via.placeholder.com/...` ở trên bằng đường dẫn ảnh thực tế trên Github của bạn).*

---

## 🤝 Đóng góp (Contributing)

Những đóng góp từ cộng đồng luôn là điều làm cho thế giới mã nguồn mở trở nên tuyệt vời. Bất kỳ đóng góp nào của bạn đều được **đánh giá cao**.

Nếu bạn có gợi ý để cải thiện dự án, vui lòng làm theo các bước sau:
1. Fork repository này.
2. Tạo một nhánh tính năng mới (`git checkout -b feature/TinhNangMoi`).
3. Commit các thay đổi của bạn (`git commit -m 'Thêm tính năng TinhNangMoi'`).
4. Push lên nhánh đó (`git push origin feature/TinhNangMoi`).
5. Mở một Pull Request để cùng review.

---

## 📄 Bản quyền (License)

Dự án này được phân phối dưới giấy phép **MIT License**. Xin vui lòng xem file `LICENSE` đính kèm trong repository để biết thêm thông tin chi tiết về quyền hạn và giới hạn sử dụng.

---

## ✉️ Liên hệ (Contact)

Nếu bạn có câu hỏi, góp ý, hoặc muốn trao đổi thêm về hệ thống, hãy liên hệ với tôi qua:

- **Tác giả:** Phuc1810
- **Email:** *[tranhoaiphuc1810@gmail.com]*
- **LinkedIn:** *[https://www.linkedin.com/in/ph%C3%BAc-tr%E1%BA%A7n-ho%C3%A0i-97807b313/?isSelfProfile=true]*
- **Project Link:** [https://github.com/Phuc1810/DoanLVTN](https://github.com/Phuc1810/DoanLVTN)

