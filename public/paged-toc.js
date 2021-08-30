function createToc(config){
    const content = config.content;
    const tocElement = config.tocElement;
    const titleElements = config.titleElements;
    
    let tocElementDiv = content.querySelector(tocElement);
    let tocUl = document.createElement("ul");
    tocUl.id = "list-toc-generated";
    tocElementDiv.appendChild(tocUl);

    // add class to all title elements
    let tocElementNbr = 0;

    for(var i = 0; i < titleElements.length; i++){
        
        let titleHierarchy = i + 1;
        let titleElement = content.querySelectorAll(titleElements[i]);

        titleElement.forEach(function(element) {

            // add classes to the element
            element.classList.add("title-element");
            element.setAttribute("data-title-level", titleHierarchy);

            // add id if doesn't exist
            tocElementNbr++;
            idElement = element.id;
/*            
            if(idElement == ''){
                element.id = 'title-element-' + tocElementNbr;
            }
*/
            // we will overwrite all ids to avoid duplicated ids
            element.id = 'title-element-' + tocElementNbr;

            let newIdElement = element.id;
        });
    }

    // create toc list
    let tocElements     = content.querySelectorAll(".title-element");
    let chapterNumber   = [0,0,0,0,0,0];

    for(var i= 0; i < tocElements.length; i++){
        let tocElement = tocElements[i];
        let tocNewLi = document.createElement("li");
    
        /* the level is also the postion in the chapterNumber Array */
        let arrayPosition = tocElement.dataset.titleLevel-1;
        
        /* higher the current number */
        chapterNumber[arrayPosition]++;

        /* set all deeper level numbers to 0 */
        while(arrayPosition < 6)
        {
            arrayPosition++;
            chapterNumber[arrayPosition] = 0;
        }

        let chapterNumberText = chapterNumber.join(".").replace(/\.0/g, "");
        if(chapterNumber[1] == 0){ chapterNumberText += "."; }

        tocNewLi.classList.add("toc-element");
        tocNewLi.classList.add("toc-element-level-" + tocElement.dataset.titleLevel);
        tocNewLi.innerHTML = '<span class="headlineCounterToC">' + chapterNumberText + '</span><a href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
        tocUl.appendChild(tocNewLi);

        tocElement.innerHTML = '<span class="headlineCounter">' + chapterNumberText + '</span>' + tocElement.innerHTML;

    }
}