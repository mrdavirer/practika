// index.js

const searchButton = document.getElementById("searchButton");
const keywordInput = document.getElementById("keywordInput");
const urlList = document.getElementById("urlList");
const progressBar = document.getElementById("progressBar");
const contentList = document.getElementById("contentList");

searchButton.addEventListener("click", async () => {
    const keyword = keywordInput.value;
    if (!keyword) return;
    const urls = await getUrls(keyword);
    if (urls) {
        displayUrls(urls);
    }
});

async function getUrls(keyword) {
    try {
        const response = await fetch(`/search/${keyword}`);
        if (response.ok) {
            const urls = await response.json();
            return urls;
        } else {
            alert("Неверное ключевое слово! Введите games или films");
        }
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

function displayUrls(urls) {
    urlList.innerHTML = "";
    urls.forEach(url => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = url;
        li.addEventListener("click", () => downloadContentWithProgress(url));
        urlList.appendChild(li);
    });
}

async function downloadContentWithProgress(url) {
    try {
        const eventSource = new EventSource(`/download/${encodeURIComponent(url)}`);
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.progress) {
                progressBar.style.width = data.progress + "%";
                progressBar.textContent = data.progress + "%";
            }
            if (data.content) {
                localStorage.setItem(url, data.content);
                displayContent(url, data.content);
                eventSource.close();
            }
        };
        eventSource.onerror = function(event) {
            console.error("EventSource error:", event);
            eventSource.close();
        };
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

function displayContent(url, content) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = url;
    li.addEventListener("click", () => {
        const storedContent = localStorage.getItem(url);
        if (storedContent) {
            const newWindow = window.open();
            newWindow.document.write("<html><head><title>Content</title></head><body>");
            newWindow.document.write(`<pre>${storedContent}</pre>`);
            newWindow.document.write("</body></html>");
        }
    });
    contentList.appendChild(li);
}
