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

async function switchTab(tabId) {
    const fileName = sectionMap[tabId];
    if (!fileName) return;

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
            const response = await fetch(fileName);
            const html = await response.text();
            const contentArea = document.querySelector('.content');
            
            // Append new content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            contentArea.appendChild(tempDiv);
            
            loadedFiles.add(fileName);
            renderMarkdown(); // Render MD for new content
        } catch (error) {
            console.error('Failed to load section:', error);
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
    }
}

function renderMarkdown() {
    document.querySelectorAll('.markdown-render').forEach(el => {
        const rawContent = el.getAttribute('data-markdown') || el.textContent;
        if (!el.getAttribute('data-markdown')) {
            el.setAttribute('data-markdown', rawContent);
        }
        el.innerHTML = marked.parse(rawContent.trim());
    });
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    // Determine initial tab from hash or default to intro
    const initialTab = window.location.hash ? window.location.hash.substring(1) : 'intro';
    switchTab(initialTab);
});
