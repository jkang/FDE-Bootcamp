const sectionMap = {
    'intro': 'sections/intro.html',
    'research-1': 'sections/section-1.html',
    'research-2': 'sections/section-1.html',
    'research-3': 'sections/section-1.html',
    'discovery-1': 'sections/section-2.html',
    'discovery-2': 'sections/section-2.html',
    'discovery-3': 'sections/section-2.html',
    'discovery-4': 'sections/section-2.html',
    'discovery-5': 'sections/section-2.html',
    'definition-1': 'sections/section-3.html',
    'definition-2': 'sections/section-3.html',
    'definition-3': 'sections/section-3.html',
    'definition-4': 'sections/section-3.html',
    'definition-5': 'sections/section-3.html',
    'summary': 'sections/summary.html'
};

const loadedFiles = new Set();

async function switchTab(tabId, event) {
    if (event) {
        event.preventDefault();
    }
    
    const fileName = sectionMap[tabId];
    if (!fileName) return;

    console.log(`Switching to tab: ${tabId}, loading file: ${fileName}`);

    // Update nav state
    const navLink = document.querySelector(`a[href="#${tabId}"]`);
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(item => {
        item.classList.remove('active');
    });
    if (navLink) {
        navLink.classList.add('active');
    }

    // Load file if not already loaded
    if (!loadedFiles.has(fileName)) {
        try {
            console.log(`Fetching ${fileName}...`);
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const contentArea = document.querySelector('.content');
            
            // Append new content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Move children to contentArea directly to avoid extra div wrapper
            while (tempDiv.firstChild) {
                contentArea.appendChild(tempDiv.firstChild);
            }
            
            loadedFiles.add(fileName);
            console.log(`Loaded ${fileName} successfully.`);
            
            if (typeof marked !== 'undefined') {
                renderMarkdown();
            } else {
                console.warn('Marked library not loaded yet, skipping markdown render.');
            }
        } catch (error) {
            console.error('Failed to load section:', error);
            const contentArea = document.querySelector('.content');
            contentArea.innerHTML = `<div class="section active" style="padding: 20px; color: red;">
                <h2>加载失败</h2>
                <p>无法加载章节内容：${error.message}</p>
                <p>请确保您是通过 Web 服务器（如 Live Server）访问此页面，而不是直接双击打开 HTML 文件。</p>
            </div>`;
            return;
        }
    }

    // Update visibility
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
        document.querySelector('.content').scrollTop = 0;
        console.log(`Activated section: ${tabId}`);
    } else {
        console.error(`Target section not found: ${tabId}`);
    }
}

function renderMarkdown() {
    if (typeof marked === 'undefined') return;
    
    document.querySelectorAll('.markdown-render').forEach(el => {
        const rawContent = el.getAttribute('data-markdown') || el.textContent;
        if (!el.getAttribute('data-markdown')) {
            el.setAttribute('data-markdown', rawContent);
        }
        try {
            el.innerHTML = marked.parse(rawContent.trim());
        } catch (e) {
            console.error('Markdown parsing failed:', e);
        }
    });
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    // Determine initial tab from hash or default to intro
    const initialTab = window.location.hash ? window.location.hash.substring(1) : 'intro';
    switchTab(initialTab);
});
