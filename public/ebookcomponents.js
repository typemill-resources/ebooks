Vue.component("ebook-general", {
	props: ['errors', 'formdata', 'layouts'],
	data: function(){
		return {
			src: this.$parent.root + '/plugins/ebooks/booklayouts/',
			cover: false,
			booklayout: { 'standardforms': false, 'customforms': false },
		}
	},
 	template: '<div class="ebookcover">' +
 				'<form id="design" @submit.prevent="submitstep">' +
	 				'<fieldset class="subfield">' +
	 					'<legend>Layout</legend>' +
						'<div class="large half"><img class="coverpreview" :src="cover"></div>' +
						'<div class="large half" :class="{ error : errors.design}">' +
							'<label>Select a book layout</label>' +
							'<div v-for="details,layout in layouts">' +
								'<label class="control-group">{{ layout }}' +
									'<input @change="changeCover(layout)" type="radio" name="design" v-model="formdata.layout" :value="layout" />' +
								  	'<span class="radiomark"></span>' +
								'</label>' +
							'</div>' +
							'<div class="layoutinfo" v-if="booklayout">' + 
								'<div class="label">About this layout</div>' +
								'<ul>' +
									'<li v-for="info,name in booklayout" v-if="showinfo(name)"><span class="infokey">{{ name }}:</span><a v-if="name == \'Link\'" :href="info">{{ info }}</a><span v-else>{{ info }}</span></li>' +
								'</ul>' +
							'</div>' +
						  	'<span class="error" v-if="errors.layout">{{ errors.layout[0] }}</span>' +
						'</div>' +
	 				'</fieldset>' +
					'<fieldset class="subfield" v-if="booklayout.standardforms.hyphens">' +
						'<legend>Hyphens</legend>' +
						'<div class="large" :class="{ error : errors.hyphens }">' +
							'<label class="control-group">Activate hyphens for content' +
								'<input type="checkbox" name="hyphens" v-model="formdata.hyphens" />' +
								 '<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
						'<div class="large" :class="{ error : errors.language }">' +
							'<label for="language">Language code</label>' +
							'<input id="language" name="language" type="text" v-model="formdata.language" maxlength="5" placeholder="en-gb" />' +
							'<div class="description">For english use the extended language code like "en-gb" or "en-us". For other languages use the simple code like "de" or "es".</div>' +
							'<span class="error" v-if="errors.language">{{ errors.language[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.hyphentest }">' +
							'<label for="hyphentest">Very long word for hyphen-initialization</label>' +
							'<input id="hyphentest" name="hyphentest" type="text" v-model="formdata.hyphentest" placeholder="incomprehensibilities" />' +
							'<div class="description">Enter a very long word in the choosen language like "incomprehensibilities" or "Silbentrennungsalgorithmus".</div>' +
							'<span class="error" v-if="errors.hyphentest">{{ errors.hyphentest[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<fieldset class="subfield" v-if="booklayout.standardforms.endnotes">' +
						'<legend>Endnotes</legend>' +
						'<div class="large" :class="{ error : errors.endnotes }">' +
							'<label class="control-group">Use Endnotes' +
								'<input type="checkbox" name="endnotes" v-model="formdata.endnotes" />' +
								 '<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
						'<div class="large" :class="{ error : errors.endnotestitle }">' +
							'<label for="endnotestitle">Headline for Endnotes Page</label>' +
							'<input id="endnotestitle" name="endnotestitle" type="text" v-model="formdata.endnotestitle" maxlength="80" />' +
							'<span class="error" v-if="errors.endnotestitle">{{ errors.endnotestitle[0] }}</span>' +
						'</div>' +
					'</fieldset>' +	
					'<fieldset class="subfield" v-if="booklayout.customforms">' +
						'<legend>Additional Settings</legend>' +
		                '<component v-for="(fielddefinition, fieldname) in booklayout.customforms.fields"' +
		                    ':key="fieldname"' +
		                    ':is="selectComponent(fielddefinition)"' +
		                    ':errors="errors"' +
		                    ':name="fieldname"' +
		                    'v-model="formdata[fieldname]"' +
		                    'v-bind="fielddefinition">' +
		                '</component>' +
					'</fieldset>' +
					'<div class="large"><button ref="submitdesign" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
			  '</div>',
	mounted: function(){
		
		this.booklayout = this.layouts[this.formdata.layout];
		this.cover = this.src + this.formdata.layout + '/cover.png';

		if(!this.$parent.initialize)
		{
			this.$parent.storeEbookData();
		}
		this.$parent.initialize = false;
	},
	methods: {
		changeCover: function(details)
		{
			this.cover = this.src + this.formdata.layout + '/cover.png';
			this.booklayout = this.layouts[this.formdata.layout];
		},
/*		getCover: function(layout)
		{
//			return this.src + layout + '/cover.png';
		},
*/		showinfo: function(name)
		{
			if(name != 'standardforms' && name != 'customforms')
			{
				return true;
			}
		},
		submitstep: function()
		{
			this.$parent.submit('front');
		},
		selectComponent: function(field)
		{
			return 'component-'+field.type;
		},		
	}
});

Vue.component("ebook-front", {
	props: ['errors', 'formdata', 'layouts'],
	data: function(){
		return {
			booklayout: { 'standardforms': false, 'customforms': false },
		}
	},
 	template: '<div>' +
 				'<form id="front" @submit.prevent="submitstep">' +
		 			'<fieldset class="subfield" v-if="booklayout.standardforms.titlepage">' +
		 				'<legend>Cover & Titlepage</legend>' +
						'<div class="large" :class="{ error : errors.title }">' +
							'<label for="title">Title*</label>' +
							'<input id="title" name="title" type="text" v-model="formdata.title" maxlength="80" required />' +
							'<span class="error" v-if="errors.title">{{ errors.title[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.subtitle }">' +
							'<label for="subtitle">Subtitle</label>' +
							'<input id="subtitle" name="subtitle" type="text" v-model="formdata.subtitle" maxlength="80" />' +
							'<span class="error" v-if="errors.subtitle">{{ errors.subtitle[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.author }">' +
							'<label for="author">Author*</label>' +
							'<input id="title" name="author" type="text" v-model="formdata.author" maxlength="80" required />' +
							'<span class="error" v-if="errors.author">{{ errors.author[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.edition }">' +
							'<label for="edition">Edition</label>' +
							'<input id="edition" name="edition" type="text" v-model="formdata.edition" maxlength="80" />' +
							'<span class="error" v-if="errors.edition">{{ errors.edition[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
		 			'<fieldset class="subfield" v-if="booklayout.standardforms.coverbackground">' +
		 				'<legend>Background for Cover</legend>' +
						'<component-image :value="getCoverImage(formdata.coverimage)" name="coverimage" label="Background image for the cover" description="Maximum size 5 MB. Background images are not supported by all book designs." errors="errors.coverimage"></component-image>' +
						'<div class="large" :class="{ error : errors.coverimageonly }">' +
							'<label class="control-group">Use only the background image and hide all other content on the cover' +
								'<input type="checkbox" name="design" v-model="formdata.coverimageonly" />' +
								'<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
						'<div class="large" :class="{ error : errors.primarycolor }">' +
							'<label for="primarycolor">Primary Background Color</label>' +
							'<input id="primarycolor" name="primarycolor" type="text" v-model="formdata.primarycolor" placeholder="cadetblue" maxlength="20" />' +
							'<div class="description">Use html color name or HEX code starting with #. Background colors are not supported by all book themes.</div>' +
							'<span class="error" v-if="errors.primarycolor">{{ errors.primarycolor[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.secondarycolor }">' +
							'<label for="primarycolor">Secondary Background Color</label>' +
							'<input id="secondarycolor" name="secondarycolor" type="text" v-model="formdata.secondarycolor" placeholder="#333333" maxlength="20" />' +
							'<div class="description">Use html color name or HEX code starting with #. Background colors are not supported by all book themes.</div>' +
							'<span class="error" v-if="errors.secondarycolor">{{ errors.secondarycolor[0] }}</span>' +
						'</div>' +
					'</fieldset>' + 
					'<fieldset class="subfield" v-if="booklayout.standardforms.imprint">' + 
						'<legend>Imprint</legend>' +
						'<div class="large" :class="{ error : errors.imprint}">' +
							'<label for="title">Text for Imprint</label>' +
							'<textarea @change="autosize()" rows="8" id="imprint" name="imprint" v-model="formdata.imprint" class="textareaclass" maxlength="1500"></textarea>' +
							'<span class="error" v-if="errors.imprint">{{ errors.imprint[0] }}</span>' +
						'</div>' +
					'</fieldset>' + 
					'<fieldset class="subfield" v-if="booklayout.standardforms.dedication">' + 
						'<legend>Dedication</legend>' +
						'<div class="large" :class="{ error : errors.dedication}">' +
							'<label for="title">Text for Dedication</label>' +
							'<textarea @change="autosize()" rows="8" id="dedication" name="dedication" v-model="formdata.dedication" class="textareaclass" maxlength="1500"></textarea>' +
							'<span class="error" v-if="errors.dedication">{{ errors.dedication[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<fieldset class="subfield" v-if="booklayout.standardforms.toc">' +
						'<legend>Table of Contents</legend>' +
						'<div class="large" :class="{ error : errors.toc }">' +
							'<label class="control-group">Insert Table of Contents' +
								'<input type="checkbox" name="toc" v-model="formdata.toc" />' +
								 '<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
						'<div class="large" :class="{ error : errors.toctitle }">' +
							'<label for="toctitle">Title for Table of Contents</label>' +
							'<input id="toctitle" name="toctitle" type="text" v-model="formdata.toctitle" maxlength="80" />' +
							'<span class="error" v-if="errors.toctitle">{{ errors.toctitle[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.toclevel }">' +
							'<label for="toclevel">How many headline levels (1-6)?</label>' +
							'<input id="toclevel" name="toclevel" type="number" v-model="formdata.toclevel"  min="1" max="6" />' +
							'<span class="error" v-if="errors.toclevel">{{ errors.toclevel[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.toccounter }">' +
							'<label class="control-group">Add counter before headlines' +
								'<input type="checkbox" name="toccounter" v-model="formdata.toccounter" />' +
								 '<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
					'</fieldset>' +					
					'<div class="large"><button ref="submitfront" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
			'</div>',
	mounted: function(){
		this.booklayout = this.layouts[this.formdata.layout];

		this.$parent.storeEbookData();

		this.$nextTick(() => {
			this.autosize();
		});
	},
	methods: {
		validate: function(field)
		{
			/* use the html5 field validation for error messages. NOT IN USE */
			this.errors[field.name] = false;
			if(field.validationMessage != '')
			{
				this.errors[field.name] = [field.validationMessage];
			}
		},
		getCoverImage: function(imageUrl)
		{
			if(imageUrl)
			{
				return imageUrl;
			}
			return '';
		},
		submitstep: function()
		{
			this.$parent.submit('content');
		},
		autosize: function()
		{
			autosize(document.querySelector('textarea'));
		},
	},
});

Vue.component("ebook-content", {
	props: ['navigation'],
   	template: '<div class="large">' +
	   				'<label>Select content from navigation</label>'+
	   				'<div class="tableofcontents">'+
	   					'<button @click.prevent="reset()" class="button bg-tm-green white bn br2 mb3 pointer">Load Latest Content Tree</button>'+
	   					'<list :navigation="navigation"></list>'+
	   				'</div>'+
	   				'<p>* All pages are included by default. You can exclude pages from the ebook by deselecting them. If you deselect a folder, all sub-items will be excluded, too. If you want to change the structure or the order, then please change it in the navigation of the webside.</p>'+					

					'<div><button @click="submitstep" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
   			'</div>',
	mounted: function(){
		this.$parent.storeEbookData();
	},
	methods: {
		reset: function()
		{
			this.$parent.resetNavigation();
		},
		submitstep: function()
		{
			this.$parent.submit('back');
		},
	}
});

Vue.component("list", {
	props: ['navigation'],
	data: function(){
		return {
			folder: 'folder'
		}
	},
   	template: '<ul>' +
   	 			'<li v-for="item in publishedItems" :class="item.class">' + 
					'<label class="control-group">{{item.name}}' +
					  '<input type="checkbox"' + 
						' :id="item.keyPath"' +
					    ' :name="item.name"' + 
					    ' v-model="item.exclude"' +
					    ' @change="selectedItem($event, item)">' +				
				  	  '<span class="checkmark"></span>' +
   	 				'</label>' +
   	 				'<div v-if="item.elementType == folder"><list :navigation="item.folderContent"></list>' +
   	 			'</li>' +
   	 		  '</ul>',
	computed: {
	   	publishedItems: function () 
	   	{
		    return this.navigation.filter(function (item)
		    {
		      	return item.status == "published";
		    })
	  	}
	},
	methods: {
		selectedItem: function(event,item)
		{
			if(item.class == 'unselected')
			{
				item.class = '';
			}
			else
			{
				item.class = 'unselected';
			}
		},
	},
});

Vue.component("ebook-back", {
	props: ['errors', 'formdata', 'layouts'],
	data: function(){
		return {
			booklayout: { 'standardforms': false, 'customforms': false },
		}
	},
 	template: '<div>' +
 				'<form id="back" @submit.prevent="submitstep">' +
	 				'<fieldset>' +
						'<div class="large" :class="{ error : errors.blurb}" v-if="booklayout.standardforms.blurb">' +
							'<label for="blurb">Blurb</label>' +
							'<textarea @input="validate(blurb)" @change="autosize()" rows="8" id="blurb" name="blurb" v-model="formdata.blurb" class="textareaclass" maxlength="1500" ></textarea>' +
							'<span class="error" v-if="errors.blurb">{{ errors.blurb[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<div class="large"><button ref="submitback" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
			  '</div>',
	mounted: function(){
		this.booklayout = this.layouts[this.formdata.layout];

		this.$parent.storeEbookData();

		this.autosize();
	},
	methods: {
		validate: function(field)
		{
			/* use the html5 field validation for error messages */
			this.errors[field.name] = false;
			if(field.validationMessage != '')
			{
				this.errors[field.name] = [field.validationMessage];
			}
		},		
		submitstep: function()
		{
			this.$parent.submit('create');
		},
		autosize: function()
		{
			autosize(document.querySelector('textarea'));
		},
	},
});

Vue.component("ebook-create", {
	props: ['errors', 'formdata', 'navigation', 'root'],
	data: function(){
		return {
			previewUrl: false,
		}
	},	
    template: '<div class="large">' + 
    			'<h2>Create the ebook</h2>' +
    			'<p>Right now you can only create a pdf. Formats like ePub will follow.</p>' +  
    			'<p>The button below will open a html-preview of the ebook in a separate page. You can download and save the ebook as pdf with your printer driver. Please upload the pdf to the folder "data/ebooks".</p>' + 
    			'<a :href="previewUrl" @click="storeItem()" target="_blank" class="link button bn bg-tm-green dim dib mt3">Create ebook (HTML/PDF)</a>' +
    			'<h2>Limitations</h2>' +
    			'<p>Please use a recent version of the following browsers:</p>' + 
    			'<ul>' +
    				'<li>Chromium</li>' +
    				'<li>Google Chrome</li>' +
    				'<li>Brave</li>' +
    				'<li>Opera</li>' +
    			'</ul>' +
    			'<p>In your PDF printer configurations please check the following extended settings:</p>' +
    			'<ul>' +
    				'<li>Set margins to “none”</li>' +
    				'<li>Uncheck “Headers and footers” or set them to none</li>' +
    				'<li>Check “Background graphics”</li>' +
    			'</ul>' +
    		  '</div>',
	mounted: function(){

		this.previewUrl = this.$parent.getPreviewUrl();

		this.$parent.storeEbookData();
	},
	methods: {
		storeItem: function()
		{
			this.$parent.tmpStoreItem();
		},
	},	
});