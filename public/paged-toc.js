function createToc(config){

	/* settings */
	const content       = config.content;
	const tocElement    = config.tocElement;
	const tocLevels     = (config.tocLevels !== undefined) ? config.tocLevels : 6;
	const tocCounter    = (config.tocCounter !== undefined) ? config.tocCounter : false;
	const headlineArea  = (config.headlineArea !== undefined) ? config.headlineArea : false;

	/* create toc-list element */
	let tocElementDiv   = content.querySelector(tocElement);
	let tocUl           = document.createElement("ul");
	tocUl.id            = "list-toc-generated";
	tocElementDiv.appendChild(tocUl);

	/* add class to all title elements */
	let titleElements = ["h1", "h2", "h3", "h4", "h5", "h6"];
	let tocElementNbr = 0;
	for(var i = 0; i < 6; i++)
	{
		let titleHierarchy  = i + 1;
		let titleIdentifier = headlineArea ? ( headlineArea + " " + titleElements[i] ) : titleElements[i];
		let titleElement    = content.querySelectorAll(titleIdentifier);

		titleElement.forEach(function(element)
		{
			/* add classes to the element */
			element.classList.add("title-element");
			element.setAttribute("data-title-level", titleHierarchy);

			/* we will overwrite all ids to avoid duplicated ids */
			tocElementNbr++;
			element.id = 'title-element-' + tocElementNbr;
		});
	}

	/* get all headlines */
	let tocElements     = content.querySelectorAll(".title-element");

	/* if the toc-counter is activated */
	if(tocCounter)
	{
		/* create an array to count up the chapter numbers */
		let chapterNumber   = [0,0,0,0,0,0];

		for(var i = 0; i < tocElements.length; i++)
		{
			/* create the list entry for the headline */
			let tocElement  = tocElements[i];
			let tocNewLi    = document.createElement("li");
		
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

			/* create a string from the chapterNumber-Array, join it with "." and delete all .0 */
			let chapterNumberText = chapterNumber.join(".").replace(/\.0/g, "");

			/* for the first chapter level add a point like 1. 2. 3. */
			if(chapterNumber[1] == 0){ chapterNumberText += "."; }

			/* add headline to the TOC, if the level of the current title is <= to the configured headline level for the toc element */
			if(tocElement.dataset.titleLevel <= tocLevels)
			{
				/* add a class to the toc-list-item */
				tocNewLi.classList.add("toc-element");
				tocNewLi.classList.add("toc-element-level-" + tocElement.dataset.titleLevel);
				
				/* add the counter to the list element */
				tocNewLi.innerHTML = '<span class="headlineCounterToC">' + chapterNumberText + '</span><a href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
				
				/* add the list element to the end of the toc-element */
				tocUl.appendChild(tocNewLi);
			}

			/* add the counter to the headline element */
			tocElement.innerHTML = '<span class="headlineCounter">' + chapterNumberText + ' </span><span class="headlineContent">' + tocElement.innerHTML + '</span>';
		}
	}
	else
	{
		for(var i = 0; i < tocElements.length; i++)
		{
			/* create the list entry for the headline */
			let tocElement  = tocElements[i];
			let tocNewLi    = document.createElement("li");

			/* add headline to the TOC, if the level of the current title is <= to the configured headline level for the toc element */
			if(tocElement.dataset.titleLevel <= tocLevels)
			{
				/* add a class to the toc-list-item */
				tocNewLi.classList.add("toc-element");
				tocNewLi.classList.add("toc-element-level-" + tocElement.dataset.titleLevel);
				
				/* add the content to the list element */
				tocNewLi.innerHTML = '<a href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
				
				/* add the list element to the end of the toc-element */
				tocUl.appendChild(tocNewLi);
			}
		}
	}
}