const WORKER_URL1 = 'https://commend.longrichli.qzz.io';

// 获取名言列表
async function getQuotes() {
    try {
        const response = await fetch(`${WORKER_URL1}/api/quote`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const quotes = await response.json();

        console.log('quotes:', quotes);

        return Array.isArray(quotes) ? quotes : [];
    } catch (error) {
        console.error('获取名言失败:', error);
        return [];
    }
}

// 显示名言
function displayQuote(quote) {
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');

    quoteElement.textContent = quote.quote_text || '';
    authorElement.textContent = quote.quote_author
        ? `— ${quote.quote_author}`
        : '';
}

// 获取并显示
async function displayRandomQuote() {
    if (localStorage.getItem('quotes') !== null) {
        
        const storedQuotes = JSON.parse(localStorage.getItem('quotes'));
        if (Array.isArray(storedQuotes) && storedQuotes.length > 0) {
            displayQuote(storedQuotes[0]);
        }
    }
    const quotes = await getQuotes();
    if (quotes.length > 0) {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }
}

displayRandomQuote();
