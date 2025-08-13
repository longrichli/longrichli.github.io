fetch('/js/quotes.json')
.then(response => response.json())
.then(data => {
    const quotes = data;
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];
    document.getElementById('quote').textContent = quote.text;
    document.getElementById('author').textContent = `- ${quote.author}`;
})
.catch(error => console.error('Error fetching quotes:', error));

