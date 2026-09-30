/**
 * Global Sidebar Drawer Toggle Engine
 * Kandili Workspace
 */
(function() {
    function initSidebar() {
        const appShell = document.querySelector('.app-shell');
        const burgerBtn = document.getElementById('burgerMenuBtn');
        const sidebar = document.querySelector('.app-sidebar');

        if (!appShell || !sidebar) {
            console.warn('[SidebarToggle] .app-shell or .app-sidebar not found in DOM.');
            return;
        }

        // 1. Create mobile backdrop if not present
        let backdrop = document.querySelector('.sidebar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            backdrop.id = 'sidebarBackdrop';
            appShell.prepend(backdrop);
        }

        function toggleSidebar(e) {
            if (e) e.stopPropagation();
            const isOpen = appShell.classList.toggle('sidebar-open');
            backdrop.classList.toggle('active', isOpen);
            console.log('[SidebarToggle] Sidebar state:', isOpen ? 'OPEN' : 'CLOSED');
        }

        function closeSidebar() {
            appShell.classList.remove('sidebar-open');
            backdrop.classList.remove('active');
        }

        // 2. Attach toggle click to the burger button
        if (burgerBtn) {
            burgerBtn.removeEventListener('click', toggleSidebar);
            burgerBtn.addEventListener('click', toggleSidebar);
        } else {
            console.warn('[SidebarToggle] #burgerMenuBtn element was not found in header.');
        }

        // 3. Close when clicking the backdrop
        backdrop.addEventListener('click', closeSidebar);

        // 4. Close when clicking any link inside the sidebar
        sidebar.querySelectorAll('.app-sidebar-link').forEach(link => {
            link.addEventListener('click', closeSidebar);
        });

        // 5. Close when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && appShell.classList.contains('sidebar-open')) {
                closeSidebar();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();