const WORKER_URL = 'https://commend.longrichli.qzz.io';
const isHttps = location.protocol === 'https:';
const debug = 0;
(function () {
    async function recordView(articleTitle, viewCountSpan) {
        try {
            const response = await fetch(`${WORKER_URL}/api/views/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    article_title: articleTitle
                })
            });

            const data = await response.json();

            if (data.success && viewCountSpan) {
                viewCountSpan.textContent = data.view_count;
            } else if (viewCountSpan) {
                viewCountSpan.textContent = '?';
            }
        } catch (error) {
            console.error('FAILD:', error);
            if (viewCountSpan) {
                viewCountSpan.textContent = '?';
            }
        }
    }

    // 自动查找并处理所有查看次数元素
    function initViewCounts() {
        const viewCountSpan = document.getElementById('view-count');
        if (!viewCountSpan) return;

        const articleTitle = viewCountSpan.dataset.articleTitle;
        if (!articleTitle) {
            console.error('未找到文章标题');
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                recordView(articleTitle, viewCountSpan);
            });
        } else {
            recordView(articleTitle, viewCountSpan);
        }
    }
    if(isHttps || debug)
        // 启动
        initViewCounts();
    else 
        document.getElementById('view-count').textContent = '0';
})();

const ARTICLE_TITLE = document.getElementById('view-count').dataset.articleTitle;

// 存储当前回复的评论
let currentReplyTo = null;

// 获取评论列表
async function fetchComments() {
    try {
        const response = await fetch(`${WORKER_URL}/api/comments?article_title=${ARTICLE_TITLE}`);
        const comments = await response.json();
        if (comments && comments.length > 0) {
            renderComments(comments);
            updateCommentCount(comments.length);
        } else {
            showError('暂无评论');
        }
    } catch (error) {
        console.error('获取评论失败:', error);
        showError('网络错误，请稍后重试');
    }
}

// 渲染评论
function renderComments(comments) {
    const container = document.getElementById('comments-container');

    if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="empty">暂无评论</div>';
        return;
    }

    // 组织评论层级结构
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
        if (comment.parent_id === 0) {
            rootComments.push(commentMap.get(comment.id));
        } else {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies.push(commentMap.get(comment.id));
            }
        }
    });

    // 生成 HTML
    container.innerHTML = rootComments.map(comment => renderCommentTree(comment, 0)).join('<div style="height:1px; width:100%; background:#999999"></div>');
}

// 递归渲染评论树
function renderCommentTree(comment, level) {
    const isAuthorReply = comment.is_author_reply === 1;

    return `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <div class="comment-avatar">
                            ${getAvatar(comment.user_email, comment.user_name)}
                        </div>
                        <div>
                            <span class="comment-author">${escapeHtml(comment.user_name)}</span>
                            ${isAuthorReply ? '<span class="author-tag">作者</span>' : ''}
                            ${comment.replay_user_name && level != 1? `<span class="reply-to">回复 @${escapeHtml(comment.replay_user_name)}</span>` : ''}
                            <span class="comment-time">${formatTime(comment.created_at)}</span>
                        </div>
                    </div>
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-actions">
                        <button onclick="showReplyForm(${comment.id}, '${escapeHtml(comment.user_name)}')">回复</button>
                    </div>
                    <div class="reply-form" id="reply-form-${comment.id}">
                        <input type="text" class="reply-input" id="reply-content-${comment.id}" placeholder="写下你的回复...">
                        <button class="reply-submit" onclick="submitReply(${comment.id})">提交回复</button>
                    </div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="replies-${level}">
                            ${comment.replies.map(reply => renderCommentTree(reply, level+1)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
}

// 获取头像（使用 Gravatar）
function getAvatar(email, name) {
    if (email) {
        const qqMatch = email.match(/^(\d+)@qq\.com$/i);
        if (qqMatch) {
            const qq = qqMatch[1];
            return `<img src="https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=40" style="width:60px;height:60px;border-radius:50%">`;
        }
        const hash = md5(email.trim().toLowerCase());
        const src = generateAvatarFromEmail(email, 40)
        return `<img src="${src}" style="width:60px;height:60px;border-radius:50%">`;
    }
    return name.charAt(0).toUpperCase();
}

// 提交评论时的校验
function validateCommentForm(userName, userEmail, content) {
    // 昵称校验
    if (!userName || userName.trim().length === 0) {
        alert("请填写昵称");
        return false;
    }
    if (userName.length > 50) {
        alert("昵称不能超过50个字符");
        return false;
    }
    
    // 邮箱校验
    if (!userEmail || userEmail.trim().length === 0) {
        alert("请填写邮箱");
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        alert("请输入正确的邮箱格式");
        return false;
    }
    
    // 内容校验
    if (!content || content.trim().length === 0) {
        alert("请填写评论内容");
        return false;
    }
    
    return true;
}

function validateHttpsUrl(url) {
    if (!url || url.trim() === '') {
        return { valid: true, value: null };
    }
    
    let cleanUrl = url.trim();
    
    
    try {
        const urlObj = new URL(cleanUrl);
        // 只允许 https 协议
        if (urlObj.protocol !== 'https:') {
            return { valid: false, error: '只支持 HTTPS 协议' };
        }
        return { valid: true, value: urlObj.toString() };
    } catch {
        return { valid: false, error: '网址格式不正确' };
    }
}

// 发表评论
async function submitComment(parentId = 0, replyToUserName = null) {
    const userName = document.getElementById('user-name')?.value.trim();
    const userEmail = document.getElementById('user-email')?.value.trim();
    const userWebsite = document.getElementById('user-website')?.value.trim() || null;
    const content = document.getElementById('comment-content')?.value.trim();

    if (!validateCommentForm(userName, userEmail, content, )) {
        return;
    }
    let urlObj = validateHttpsUrl(userWebsite);
    if(!urlObj.valid) {
        alert(urlObj.error);
        return;
    }
    

    const commentData = {
        article_title: ARTICLE_TITLE,
        parent_id: parentId,
        reply_to_user_name: replyToUserName,
        user_name: userName,
        user_email: userEmail,
        user_website: urlObj.value,
        content: content,
        created_at: Date.now()
    };

    try {
        const response = await fetch(`${WORKER_URL}/api/comments/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData)
        });

        const data = await response.json();

        if (data.success) {
            // 清空表单
            if (parentId === 0) {
                document.getElementById('comment-content').value = '';
            }
            // 刷新评论列表
            await fetchComments();
            // 关闭回复表单
            if (parentId !== 0) {
                hideReplyForm(parentId);
            }
            saveUserInfo(userName, userEmail, urlObj.value);
        } else {
            alert('发表评论失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        console.error('提交评论失败:', error);
        alert('网络错误，请稍后重试');
    }
}



// 回复评论
function submitReply(parentId) {
    const replyContent = document.getElementById(`reply-content-${parentId}`)?.value.trim();
    if (!replyContent) {
        alert('请填写回复内容');
        return;
    }

    // 临时设置主表单的内容
    const originalContent = document.getElementById('comment-content')?.value;
    document.getElementById('comment-content').value = replyContent;

    // 获取被回复的用户名
    const parentComment = document.querySelector(`.comment-item[data-comment-id="${parentId}"] .comment-author`);
    const replyToUserName = parentComment ? parentComment.innerText : null;

    submitComment(parentId, replyToUserName);

    // 恢复原内容
    if (originalContent !== undefined) {
        document.getElementById('comment-content').value = originalContent;
    }
}

// 显示回复表单
function showReplyForm(commentId, userName) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm.classList.contains('show')) {
        replyForm.classList.remove('show');
        return;
    }
    // 关闭所有其他回复表单
    document.querySelectorAll('.reply-form').forEach(form => {
        form.classList.remove('show');
    });

    
    if (replyForm) {
        replyForm.classList.add('show');
        document.getElementById(`reply-content-${commentId}`)?.focus();
    }
}

// 隐藏回复表单
function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        replyForm.classList.remove('show');
    }
}

// 更新评论数
function updateCommentCount(count) {
    const countSpan = document.getElementById('comment-count');
    if (countSpan) {
        countSpan.textContent = `${count} 条评论`;
    }
}

// 格式化时间
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 转义 HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 简单 MD5（用于 Gravatar）
function md5(str) {
    // 这里需要一个简单的 MD5 实现
    // 可以使用 https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js
    // 或使用简单版本
    return str; // 临时返回原字符串，实际使用时需要引入 MD5 库
}

// 显示错误
function showError(message) {
    const container = document.getElementById('comments-container');
    container.innerHTML = `<div class="empty">${message}</div>`;
}

function loadUserInfo() {
    const savedName = localStorage.getItem('comment_user_name');
    const savedEmail = localStorage.getItem('comment_user_email');
    const savedWebsite = localStorage.getItem('comment_user_website');

    if (savedName) document.getElementById('user-name').value = savedName;
    if (savedEmail) document.getElementById('user-email').value = savedEmail;
    if (savedWebsite) document.getElementById('user-website').value = savedWebsite;
}

// 提交评论时，保存当前输入到 LocalStorage
function saveUserInfo(name, email, website) {

    if (name) localStorage.setItem('comment_user_name', name);
    if (email) localStorage.setItem('comment_user_email', email);
    if (website) localStorage.setItem('comment_user_website', website);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchComments();
    loadUserInfo();
});


/*=======================================*/
/**
 * 根据邮箱地址生成确定性的头像（不依赖任何外部服务）
 * @param {string} email - 用户邮箱
 * @param {number} size - 头像尺寸（像素），默认 40
 * @returns {string} DataURL 格式的图片，可直接用于 img.src
 */
function generateAvatarFromEmail(email, size = 40) {
    const svgString = multiavatar(email);
    // 将 SVG 字符串转为 DataURL
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    return dataUrl;
}