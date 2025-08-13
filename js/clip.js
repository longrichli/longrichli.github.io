document.addEventListener('DOMContentLoaded', function () {
  // 为每个highlight元素添加复制按钮
  document.querySelectorAll('.highlight').forEach(highlight => {
    // 如果已经有复制按钮则跳过
    if (highlight.querySelector('.copy-btn')) return;

    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.textContent = '复制';
    button.onclick = function () {
      copyCode(this);
    };
    highlight.prepend(button);
  });
});


function copyCode(button) {
  const highlight = button.closest('.highlight');
  const code = highlight.querySelector('code');
  
  // 获取所有代码行
  const lines = code.querySelectorAll('.line');
  let codeText = '';
  
  // 遍历每一行，提取代码内容（保留缩进）
  lines.forEach(line => {
    // 获取该行所有 <span class="cl"> 的内容（跳过行号部分）
    const codeContent = line.querySelector('.cl');
    if (codeContent) {
      // 保留原始缩进（使用 textContent 而不是 innerText）
      codeText += codeContent.textContent;
    }
  });
  
  // 复制到剪贴板
  navigator.clipboard.writeText(codeText.trimEnd())
    .then(() => {
      button.textContent = '复制成功';
      setTimeout(() => {
        button.textContent = '复制';
      }, 500);
    })
    .catch(err => {
      console.error('复制失败:', err);
      button.textContent = '复制失败';
    });
}