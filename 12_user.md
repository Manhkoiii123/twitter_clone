# Verify email

khi nguời dùng đăng kí => gửi email => ấn vào link => change status trạng thái người dùng

dạng đường link ` duthanhduoc.com/verify-email?email_verify_token=123123` => cleint call api với method post với url là `api-manh.com/verify_email` với body là `email_verify_token` => server nhận được `email_verify_token` => tìm user này là ai và change status tài khoản của user đó => trả về => `access_token` và `refresh_token` luôn để đăng nhập luôn || ko trả về gì để ng dùng phải đăng nhập lại
