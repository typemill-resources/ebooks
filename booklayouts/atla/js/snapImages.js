class SnapImages extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    afterPageLayout(pageElement, page, breakToken){
        
        let images = pageElement.getElementsByClassName("img-snap");
        for(let i=0;i<images.length;i++){ 
            let imgwidth = images[i].clientWidth;
            let imgheight = images[i].clientHeight;
            let varBaseline = getComputedStyle(images[i]).getPropertyValue('--font-lineHeight');
            let baseline = parseInt(varBaseline.replace("px", ""));
            let varHeightx = getComputedStyle(images[i]).getPropertyValue('--height-x');
            let heightx = parseInt(varHeightx.replace("px", ""));

            let ratio = Math.round((imgheight - heightx)/baseline);
                images[i].style.height = "calc(var(--font-lineHeight)*" + ratio + " + var(--height-x))";
                images[i].style.objectFit = "cover";
                images[i].style.objectPosition = "center center";
        }
        
        
    }
}
Paged.registerHandlers(SnapImages);









