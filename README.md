# eBook Studio for Typemill

Turn your Typemill CMS into a professional **eBook publishing studio**. The eBook plugin lets you create beautiful **PDFs** and **ePUBs** directly from your existing Typemill content — no duplication, no manual formatting, no design skills required. Pick a ready-made book layout, curate the pages you want, and publish.

![Screenshot of the eBook plugin](media/live/ebook-plugin.webp){.center loading="lazy" width="820" height="544"}

## How It Works

The plugin offers two flexible modes to match your publishing workflow:

* **Feature in settings**  
  Adds a new navigation item called **“eBooks”** to the settings area. An **admin** can manage **multiple eBook projects** that pull content from the entire Typemill website.
* **Feature in pages**  
  Adds a new **“eBooks”** tab to every page. **Editors** can create and manage **one eBook** per page or folder.

To create an eBook, simply open the **“eBooks”** section in the settings or the page tab and follow the step-by-step workflow.

For a detailed guide, see the [Typemill documentation for publishers](https://typemill.net/publishers).

## Build a Multi-Book Publishing Platform

Combine the eBook plugin with the [Publisher theme](https://themes.typemill.net/publisher) and Typemill’s [projects feature](https://docs.typemill.net/author-guide/multi-project) to build a full **multi-book publishing platform**.

This setup is ideal if you want to publish and maintain multiple eBooks with different authors — all from a single Typemill installation. Watch the screencast below and visit the [demo project](https://books.typemill.net) to see it in action.

## Credits

The eBook plugin uses the JavaScript library [Paged.js](https://pagedjs.org) for the live PDF preview and a self-hosted [WeasyPrint](https://weasyprint.org/) installation for remote, high-quality PDF generation.

## GitHub

Found a bug or want to contribute? Visit the repository on GitHub: https://github.com/typemill-resources/ebooks. Pull requests and issue reports are welcome.

## Changes

### Version 2.7.0

* Checked for PHP 8.5 compatibility.
* Updated vendor dependencies (PHPePub) for PHP 8.5.
* Added select/deselect all pages feature.
* Added support for `onExportHtmlLoaded` so plugins like PlantUML can generate static assets for PDF and ePUB generation.

### Version 2.6.1

* Fixed EPUB generation.

### Version 2.6.0

* Added support for multiple projects.
* Added eBook feature for homepages.
* Fixed bug where metadata was deleted when storing eBook settings.

### Version 2.5.0

* Launched WeasyPrint remote PDF service.
* Refactored all eBook layouts for WeasyPrint.
* Added new two-column layout "folio".

### Version 2.4.0

* Generate table of contents and headline numbering server-side with PHP.
* Convert internal links within the eBook to anchor links that jump to the correct headlines.

### Version 2.3.2

* Added imagefix.js to prevent oversized elements from breaking the layout.

### Version 2.3.1

* Fixed ob_end_flush.
* Check for DOM extension.

### Version 2.3.0

* Fixed error with original images when rewritten to WebP format.
* Reactivated image attributes.
* Added custom CSS support.
* Fixed shortcode selection.
* Added preface and afterword.

### Version 2.2.0

* Fixed navigation error in system settings caused by the new navigation model.
* Fixed visibility for the eBook feature in system settings (privileges).

### Version 2.1.1

* Added autoscroll for PDF preview to render pages completely.
* Fixed undefined variables in ebooks.php.
* Added footnote styles to eBook layouts.
* Moved inline JavaScript to included files.

### Version 2.1.0

tbd.

### Version 2.0.0

Completely refactored and redesigned the plugin for Typemill 2. Older eBook projects may not work correctly with the new plugin version, but you can always reconfigure them.

### Version 1.5.0

* Updated EPUB library.
* Updated to Paged.js 0.3.5.
* Option to set logo left or right.
* Fixed hyphenation error causing missing lines.
* Fixed imprint.
* Fixed custom fields.

### Version 1.4.0

* Create multiple eBook projects from the entire website in the settings.
* Add custom CSS to each theme layout.
* Migrated many improvements from the report layout to the manual and Typemill layouts.
* Fixed a bug where the thumb index was visible in tabs when the feature was disabled.
* Option to activate and deactivate shortcodes in the eBook.
* Fixed bug with EPUB generation when content has multiple levels.
* Fixed stretched images caused by size attributes.
* Added option to remove empty pages.
* Fixed empty element/page for imprint.
* Improved conditions for adding eBook plugin JavaScript to the admin area.

### Version 1.3.1

* Fixed horizontal line for footnote area.
* Added preview image for video tutorial.
* Option to exclude the base folder from the eBook.
* Improved TOC script and CSS with headline counters in text.
* Added report layout.
* Fixed Vue error for the settings version.

### Version 1.3.0

* Reordered and renamed the tabs.
* Settings tab is completely generated with the form builder and can be defined in eBook layouts.
* New button to preview headlines in the content tab.
* PDF preview now supports footnotes with the new version of Paged.js.
* New EPUB export.
* New demo layout for manuals.
* Multi-language thumb index.

### Version 1.2.3

* Disabled eBook tab for the homepage.
* Disabled eBook navigation if page navigation was not found.

### Version 1.2.2

* Refactored headline downgrade so it works in settings and pages.
* Removed thumb index from the Typemill layout.
* Fixed license notice in imprint.
* Improved blank pages; imprint is now on the left side.
* Added dedication page.
* Added separate title page.
* Added scroll-to-top.
* Fixed table design.

### Version 1.2.1

* Fixed subchapters when the thumb index is disabled.
* Removed hyphenation logic and third-party library because Chrome supports hyphens natively on all platforms since version 88.

### Version 1.2.0

* Integrated a thumb index for multi-language manuals.
* Optimized table design.
* Added blurb.
* Updated to Paged.js 1.43.

### Version 1.1.0

* New option to create eBooks in page tabs.
* Made forms optional and configurable for each theme.
* Integrated individual forms with the form builder.
* Option to use original images.
* Option to disable automatic headline correction.

