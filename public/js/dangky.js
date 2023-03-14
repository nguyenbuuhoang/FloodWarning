const form = document.querySelector('form');

form.addEventListener('submit', function (event) {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Kiểm tra tên đăng nhập
    const username = usernameInput.value;
    const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!usernameRegex.test(username)) {
        alert('Tên đăng nhập không hợp lệ. Tên đăng nhập phải chứa ít nhất 8 ký tự bao gồm chữ và số.');
        event.preventDefault();
        return false;
    }

    // Kiểm tra email
    const email = emailInput.value;
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        alert('Email không hợp lệ. Vui lòng nhập email đúng định dạng.');
        event.preventDefault();
        return false;
    }

    // Kiểm tra mật khẩu
    const password = passwordInput.value;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('Mật khẩu không hợp lệ. Ít nhất 8 ký tự bao gồm chữ và số.');
        event.preventDefault();
        return false;
    }

    // Kiểm tra nhập lại mật khẩu
    const confirmPassword = confirmPasswordInput.value;
    if (confirmPassword !== password) {
        alert('Mật khẩu xác nhận không khớp.');
        event.preventDefault();
        return false;
    }

    return true;
});
