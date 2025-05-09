function endnotes(config)
{
	let fnsups 			= config.content.querySelectorAll("[id^='fnref']");
	let enplaceholder	= config.content.querySelector(config.enElement);
	let endnotes 		= document.createElement("ol");
				
	fnLength = fnsups.length;
	for (let i = 0; i < fnLength; i++)
	{
		let numNote = i + 1;

		/* rewrite ID */
		fnsups[i].id = "fnref-" + numNote;

		/* get the link to footnote */
		let fnref = fnsups[i].querySelector(".footnote-ref");

		/* get id of footnote that is referenced */
		let fnid = fnref.href.substring(fnref.href.indexOf("#")+1);

		/* rewrite footnote reference */
		fnref.href = "#fn-" + numNote;

		let fn = config.content.getElementById(fnid);
		fn.id = "fn-"+numNote;

		let backref = fn.querySelector(".footnote-backref");
		backref.href = "#fnref-" + numNote;
		
		endnotes.append(fn);

	}
	enplaceholder.append(endnotes);
	config.content.querySelectorAll('.footnotes').forEach(function(fnelement){
		fnelement.remove()
	})
}