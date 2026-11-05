/**
 * main.js - 全站前端互動邏輯
 * 專題作品：《成交 我的慢活日常》
 *
 * 包含功能：
 * 1. 手機版導覽列開關與 aria-expanded 狀態同步（視窗跨越 768px 斷點自動收合與解除捲動鎖定）
 * 2. 依據目前網址自動標示導覽列使用中頁面
 * 3. 錨點平滑捲動（每次點擊動態獲取 Header 高度補償）
 * 4. 側邊欄章節目錄 ScrollSpy（使用 getBoundingClientRect().top + window.scrollY 精確定位）
 * 5. 鍵盤 ESC 關閉選單無障礙支援
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  highlightCurrentPage();
  initSmoothAnchorScroll();
  initSidebarScrollSpy();
});

/**
 * 1. 手機版導覽列選單控制
 * 依據 css/responsive.css 之斷點 (max-width: 768px)
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const mobileMenu = document.querySelector('.mobile-nav-menu');

  if (!toggleBtn || !mobileMenu) return;

  // 儲存 body 原本的 overflow 設定值
  let originalOverflow = '';

  function openMenu() {
    originalOverflow = document.body.style.overflow;
    toggleBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // 避免背景同時滾動
  }

  function closeMenu() {
    toggleBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    document.body.style.overflow = originalOverflow; // 恢復原值
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // 監聽視窗寬度變化：依據 CSS 導覽列切換斷點 (768px)
  // 當視窗放大至電腦版寬度 (> 768px 即 min-width: 769px) 時，自動關閉選單並解除鎖定
  const desktopMediaQuery = window.matchMedia('(min-width: 769px)');
  const handleBreakpointChange = (e) => {
    if (e.matches && toggleBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  };

  if (desktopMediaQuery.addEventListener) {
    desktopMediaQuery.addEventListener('change', handleBreakpointChange);
  } else if (desktopMediaQuery.addListener) {
    desktopMediaQuery.addListener(handleBreakpointChange);
  }

  // 點擊選單內部連結時自動關閉選單
  const menuLinks = mobileMenu.querySelectorAll('a');
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // 點擊選單外部區域關閉
  document.addEventListener('click', (e) => {
    if (
      toggleBtn.getAttribute('aria-expanded') === 'true' &&
      !mobileMenu.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // 鍵盤 ESC 鍵關閉選單（無障礙體驗）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggleBtn.focus();
    }
  });
}

/**
 * 2. 標記目前導覽列頁面
 */
function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  let filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  if (!filename || filename === '') {
    filename = 'index.html';
  }

  const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  allNavLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // 比對相對路徑檔名
    const targetFile = href.substring(href.lastIndexOf('/') + 1);
    if (targetFile === filename) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * 3. 錨點平滑捲動（每次點擊時重新取得當前 Header 高度）
 */
function initSmoothAnchorScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

  anchorLinks.forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();

        // 每次點擊錨點時動態獲取當前 header 高度
        const header = document.querySelector('.site-header');
        const currentHeaderHeight = header ? header.offsetHeight : 72;

        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - (currentHeaderHeight + 20);

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        // 協助螢幕閱讀器與鍵盤焦點定位
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
      }
    });
  });
}

/**
 * 4. 側邊欄章節目錄 ScrollSpy
 * 使用 getBoundingClientRect().top + window.scrollY 計算區塊在頁面中的精確垂直位置
 */
function initSidebarScrollSpy() {
  const sidebarLinks = document.querySelectorAll('.sidebar-nav-item a[href^="#"]');
  if (sidebarLinks.length === 0) return;

  const sectionIds = Array.from(sidebarLinks).map((link) =>
    link.getAttribute('href').substring(1)
  );

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((sec) => sec !== null);

  if (sections.length === 0) return;

  function updateActiveSection() {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 72;
    const scrollPos = window.scrollY + headerHeight + 60;

    let currentSectionId = null;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      // 使用 getBoundingClientRect().top + window.scrollY 精確計算相對於整份頁面的頂端座標
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const sectionHeight = section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
        break;
      }
    }

    // 若捲動接近整頁底部，標示最後一個區塊
    const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
    if (!currentSectionId && isAtBottom) {
      currentSectionId = sections[sections.length - 1].getAttribute('id');
    }

    if (currentSectionId) {
      sidebarLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
    }
  }

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection, { passive: true });
  updateActiveSection();
}
