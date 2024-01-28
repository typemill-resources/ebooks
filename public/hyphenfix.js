function getFinalWord(str)
{
	return str.split(' ').pop();
}

// remove hyphens for last line to fix error (line away with some fonts)
class noHyphenBetweenPage extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.hyphenToken;
  }

  afterPageLayout(pageFragment, page, breakToken) {

    if (pageFragment.querySelector('.pagedjs_hyphen')) {

      // find the hyphenated word  
      let block = pageFragment.querySelector('.pagedjs_hyphen');

      block.dataset.ref = this.prevHyphen;

      // move the breakToken
      let offsetMove = getFinalWord(block.innerHTML).length;

      // move the token accordingly
      page.breakToken = page.endToken.offset - offsetMove;

      // remove the last word
      block.innerHTML = block.innerHTML.replace(getFinalWord(block.innerHTML), "");

      breakToken.offset = page.endToken.offset - offsetMove;

    }
  }

}

Paged.registerHandlers(noHyphenBetweenPage);
