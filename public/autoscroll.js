// Scroll while rendering
let lastScrollHeight = 0;
let interval = setInterval(function () {
    let currentScrollHeight = document.body.scrollHeight;
    if (currentScrollHeight !== lastScrollHeight) {
        window.scrollTo({ top: currentScrollHeight, behavior: 'smooth' });
        lastScrollHeight = currentScrollHeight;
    }
}, 1000);

// Custom paged.js handler
class OverlayHandler extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    // Called after all pages are generated
    afterRendered(pages) {

        clearInterval(interval);

        // Scroll back to top
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

// Register the handler
Paged.registerHandlers(OverlayHandler);