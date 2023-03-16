const form = document.querySelector('form');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  // Kiểm tra tên đăng nhập
  const username = usernameInput.value;
  const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  let isValid = true;
  if (!usernameRegex.test(username)) {
    alert('Tên đăng nhập không hợp lệ. Tên đăng nhập phải chứa ít nhất 8 ký tự bao gồm chữ và số.');
    isValid = false;
  }

  // Kiểm tra email
  const email = emailInput.value;
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    alert('Email không hợp lệ. Vui lòng nhập email đúng định dạng.');
    isValid = false;
  }

  // Kiểm tra mật khẩu
  const password = passwordInput.value;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
  if (!passwordRegex.test(password)) {
    alert('Mật khẩu không hợp lệ. Ít nhất 8 ký tự bao gồm chữ và số.');
    isValid = false;
  }

  // Kiểm tra nhập lại mật khẩu
  const confirmPassword = confirmPasswordInput.value;
  if (confirmPassword !== password) {
    alert('Mật khẩu xác nhận không khớp.');
    isValid = false;
  }

  if (isValid) {
    // Gửi request AJAX
    $.ajax({
      type: 'POST',
      url: '/dangky',
      data: $(form).serialize(),
      success: function(response) {
        if (response.success) {
          alert(response.message);
          window.location.href = '/dangnhap';
        } else {
          alert(response.message);
        }
      },
      error: function(response) {
        alert('Lỗi đăng ký');
      }
    });
  }
});
