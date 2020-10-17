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
            if(idElement == ''){
                element.id = 'title-element-' + tocElementNbr;
            } 
            let newIdElement = element.id;

        });

    }

    // create toc list
    let tocElements = content.querySelectorAll(".title-element");  

    for(var i= 0; i < tocElements.length; i++){
        let tocElement = tocElements[i];
        let tocNewLi = document.createElement("li");
        tocNewLi.classList.add("toc-element");
        tocNewLi.classList.add("toc-element-level-" + tocElement.dataset.titleLevel);
        tocNewLi.innerHTML = '<a href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
        tocUl.appendChild(tocNewLi);
    }

}