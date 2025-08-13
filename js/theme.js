// 获取按钮
const btn = document.getElementById('toggle-theme');
// 点击按钮时切换 dark-mode 类
btn.addEventListener('click', function () {
  document.documentElement.classList.toggle('dark-mode'); // 切换类

  // 保存用户选择
  if (document.documentElement.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    btn.textContent = '☀️';
  } else {
    localStorage.setItem('theme', 'light');
    btn.textContent = '🌙';
  }
});

// 页面加载时恢复用户选择
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark-mode');
  btn.textContent = '☀️';
}

