const AppointmentModule = (() => {
    let form = null;
    let removeFormListener = null;

    // Helper to add event listener and return removal function
    function addListenerWithRemoval(target, event, handler) {
        target.addEventListener(event, handler);
        return () => target.removeEventListener(event, handler);
    }

    // Initialize form event and validation
    function init() {
        form = document.getElementById('appointmentForm');
        if (!form) return;

        function onSubmit(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const appointmentData = {};
            for (let [key, val] of formData.entries()) {
                appointmentData[key] = val;
            }

            ModalModule.showSuccessModal();

            form.reset();

            console.log('Appointment data:', appointmentData);
        }

        removeFormListener = addListenerWithRemoval(form, 'submit', onSubmit);
    }

    function cleanup() {
        if (removeFormListener) {
            removeFormListener();
            removeFormListener = null;
        }
        form = null;
    }

    return { init, cleanup };
})();

const ModalModule = (() => {
    let modal = null;
    let removeWindowClickHandler = null;

    // Helper same as before
    function addListenerWithRemoval(target, event, handler) {
        target.addEventListener(event, handler);
        return () => target.removeEventListener(event, handler);
    }

    function showSuccessModal() {
        if (modal) {
            modal.style.display = 'block';
        }
    }

    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function onWindowClick(event) {
        if (event.target === modal) {
            closeModal();
        }
    }

    function init() {
        modal = document.getElementById('successModal');
        if (!modal) return;

        removeWindowClickHandler = addListenerWithRemoval(window, 'click', onWindowClick);

        // Expose closeModal globally or use module API
        window.closeModal = closeModal;
    }

    function cleanup() {
        if (removeWindowClickHandler) {
            removeWindowClickHandler();
            removeWindowClickHandler = null;
        }
        modal = null;
        // Optionally remove closeModal function from global:
        // delete window.closeModal;
    }

    return { init, cleanup, showSuccessModal, closeModal };
})();

const SmoothScrollModule = (() => {
    function init() {
        // Event delegation on body
        document.body.addEventListener('click', function (e) {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            e.preventDefault();
            const selector = anchor.getAttribute('href');
            if (!selector) return;

            const target = document.querySelector(selector);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    return { init };
})();

const AnimationModule = (() => {
    let observer = null;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    function onIntersect(entries, obs) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                obs.unobserve(entry.target);
            }
        });
    }

    function init() {
        observer = new IntersectionObserver(onIntersect, observerOptions);

        document.querySelectorAll('.service-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    function cleanup() {
        if (!observer) return;

        // Unobserve all targets currently observed
        observer.disconnect();
        observer = null;
    }

    return { init, cleanup, observerInstance: () => observer };
})();

const DOMMutationModule = (() => {
    let domObserver = null;

    // Setup mutation observer to watch for dynamic changes
    function init() {
        const observerCallback = mutations => {
            mutations.forEach(mutation => {
                mutation.removedNodes.forEach(removedNode => {
                    // Cleanup Appointment form listener if form removed
                    if (removedNode.id === 'appointmentForm' || (removedNode.contains && removedNode.contains(document.getElementById('appointmentForm')))) {
                        AppointmentModule.cleanup();
                    }

                    // Cleanup modal listeners if removed
                    if (removedNode.id === 'successModal' || (removedNode.contains && removedNode.contains(document.getElementById('successModal')))) {
                        ModalModule.cleanup();
                    }

                    // Unobserve removed service-cards
                    if (removedNode.classList && removedNode.classList.contains('service-card')) {
                        if (AnimationModule.observerInstance()) {
                            AnimationModule.observerInstance().unobserve(removedNode);
                        }
                    }
                    if (removedNode.querySelectorAll) {
                        removedNode.querySelectorAll('.service-card').forEach(card => {
                            if (AnimationModule.observerInstance()) {
                                AnimationModule.observerInstance().unobserve(card);
                            }
                        });
                    }
                });

                mutation.addedNodes.forEach(addedNode => {
                    // If new form added dynamically, initialize its listeners
                    if (addedNode.id === 'appointmentForm' || (addedNode.querySelector && addedNode.querySelector('#appointmentForm'))) {
                        AppointmentModule.init();
                    }

                    // If modal added dynamically, initialize modal listeners
                    if (addedNode.id === 'successModal' || (addedNode.querySelector && addedNode.querySelector('#successModal'))) {
                        ModalModule.init();
                    }

                    // Setup animation observer for new service-cards
                    if (addedNode.classList && addedNode.classList.contains('service-card')) {
                        addedNode.style.opacity = '0';
                        addedNode.style.transform = 'translateY(20px)';
                        addedNode.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                        if (AnimationModule.observerInstance()) {
                            AnimationModule.observerInstance().observe(addedNode);
                        }
                    }
                    if (addedNode.querySelectorAll) {
                        addedNode.querySelectorAll('.service-card').forEach(card => {
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(20px)';
                            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                            if (AnimationModule.observerInstance()) {
                                AnimationModule.observerInstance().observe(card);
                            }
                        });
                    }
                });
            });
        };

        domObserver = new MutationObserver(observerCallback);
        domObserver.observe(document.body, { childList: true, subtree: true });
    }

    function cleanup() {
        if (domObserver) {
            domObserver.disconnect();
            domObserver = null;
        }
    }

    return { init, cleanup };
})();

const DateInputModule = (() => {
    function init() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('preferredDate');
        if (dateInput) {
            dateInput.setAttribute('min', today);
        }
    }
    return { init };
})();

// --- Initialization function to start all modules ---
function initializeApp() {
    DateInputModule.init();
    AppointmentModule.init();
    ModalModule.init();
    SmoothScrollModule.init();
    AnimationModule.init();
    DOMMutationModule.init();
}

// --- Cleanup function if needed to free resources ---
function cleanupApp() {
    AppointmentModule.cleanup();
    ModalModule.cleanup();
    AnimationModule.cleanup();
    DOMMutationModule.cleanup();
    // SmoothScroll uses event delegation on body which is generally static and does not need cleanup
}

// Expose modules and init/cleanup for integration
window.AppModules = {
    initializeApp,
    cleanupApp,
    AppointmentModule,
    ModalModule,
    SmoothScrollModule,
    AnimationModule,
    DOMMutationModule,
    DateInputModule
};

// Automatically initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    window.AppModules.initializeApp();
});