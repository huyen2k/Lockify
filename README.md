### Lockify

Lockify là một dự án nhỏ, tìm hiểu về hệ mật RSA gồm mã hóa, giải mã, ký số và xác minh chữ ký số. Mục tiêu của dự án là cung cấp một giao diện trực quan và dễ sử dụng cho mục đích học tập và thử nghiệm.

## Chức năng chính

- **Mã hóa RSA**: Hỗ trợ mã hóa và giải mã dữ liệu sử dụng khóa công khai và khóa riêng.
- **Ký số số**: Cho phép ký dữ liệu bằng khóa riêng và xác minh chữ ký bằng khóa công khai.
- **Thám mã** : Sử dụng các thuật toán Trial Division, Fermat và Quadratic Sieve để thám mã các số nguyên tố lớn.

## Công nghệ sử dụng

- Sử dụng React để xây dựng giao diện người dùng, giúp người dùng dễ dàng tương tác với các chức năng của hệ mật RSA.

- Sử dụng Spring Boot để xây dựng backend, xử lý các yêu cầu mã hóa, giải mã, ký số và xác minh chữ ký số.

- Lưu trữ khóa công khai và khóa riêng trong cơ sở dữ liệu Mongodb để đảm bảo tính bảo mật và dễ dàng quản lý.

## Cách sử dụng

Thử nghiệm trên đường dẫn: [Lockify](https://lockify-iqnz.onrender.com)

(Lưu ý: Dự án có thể mất một chút thời gian để khởi động lần đầu tiên do sử dụng dịch vụ Render miễn phí.)

## Tính năng trong tương lai

- Hỗ trợ thêm các thuật toán mã hóa khác như AES, DES.
- Cải thiện giao diện người dùng để nâng cao trải nghiệm người dùng.
- Tối ưu hóa hiệu suất của các thuật toán mã hóa và giải mã.
- Thêm thuật toán thám mã nâng cao hơn.
