let pageSize = { width: null, height: null };

class RemoveOversizeAttributesPlugin extends Paged.Handler {
  afterPageLayout(pageFragment, page) {
    // Get actual page content size once
    if (!pageSize.width || !pageSize.height) {
      const pageBox = pageFragment.querySelector(".pagedjs_page_content");
      if (pageBox) {
        pageSize.width = pageBox.offsetWidth;
        pageSize.height = pageBox.offsetHeight;
        console.log("Detected page size:", pageSize);
      }
    }
  }

  beforeParsed(content) {
    const cleanOversizeAttributes = () => {
      if (!pageSize.width || !pageSize.height) {
        // Retry shortly if page size is not yet available
        setTimeout(cleanOversizeAttributes, 50);
        return;
      }

      const elements = content.querySelectorAll("[width][height]");

      elements.forEach(el => {
        const width = parseInt(el.getAttribute("width"), 10);
        const height = parseInt(el.getAttribute("height"), 10);

        if (
          (width && width > pageSize.width) ||
          (height && height > pageSize.height)
        ) {
          el.removeAttribute("width");
          el.removeAttribute("height");
          console.log("Removed oversize attributes from:", el);
        }
      });
    };

    cleanOversizeAttributes();
  }
}

Paged.registerHandlers(RemoveOversizeAttributesPlugin);