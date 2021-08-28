Vue.component("ebook-layout", {
	props: ['errors', 'formdata', 'layouts'],
	data: function(){
		return {
			src: this.$parent.root + '/plugins/ebooks/booklayouts/',
			cover: false,
			booklayout: { 'customforms': false },
		}
	},
 	template: '<div class="ebookcover">' +
 				'<form id="design" @submit.prevent="submitstep">' +
	 				'<fieldset class="subfield">' +
	 					'<legend>Select a Layout</legend>' +
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
					'<div class="large">' + 
						'<button ref="submitdesign" class="button bn br2 bg-tm-green white" type="submit">Next step</button>' +
					'</div>' +
				'</form>' +
				'<div class="large tc">' +
					'<h2>Tutorial: How to create an ebook?</h2>' +
					'<p>A short video-tutorial (just 10 minutes) on how to create an eBook with Typemill.<br/>'+
					'Click to view on <a href="https://www.youtube.com/watch?v=g5ntN4Z5pyE" target="_blank">YouTube</a></p>' +
					'<a href="https://www.youtube.com/watch?v=g5ntN4Z5pyE" target="_blank"><img :src="getVideoImgUrl()" /></a>' +
				'</div>'+
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
		getVideoImgUrl: function()
		{
			return this.$parent.root + '/plugins/ebooks/public/youtube-g5ntn4z5pye.jpeg';
		},
		showinfo: function(name)
		{
			if(name != 'customforms')
			{
				return true;
			}
		},
		submitstep: function()
		{
			this.$parent.submit('settings');
		},
	}
});

Vue.component("ebook-settings", {
	props: ['errors', 'formdata', 'layouts'],
	data: function(){
		return {
			booklayout: { 'customforms': false },
		}
	},
 	template: '<div>' +
 				'<form id="settings" @submit.prevent="submitstep">' +
					'<div v-if="booklayout.customforms" v-for="(fielddefinition, fieldname) in booklayout.customforms.fields" :class="getFieldClass(fielddefinition)">' +
						'<fieldset class="fs-formbuilder" v-if="fielddefinition.type == \'fieldset\'"><legend>{{fielddefinition.legend}}</legend>' + 
							'<component v-for="(subfield, fieldname) in fielddefinition.fields "' +
			                    ':key="fieldname"' +
			            	    ':class="getFieldClass(subfield)"' +
			                    ':is="selectComponent(subfield)"' +
			                    ':errors="errors"' +
			                    ':name="fieldname"' +
			                    'v-model="formdata[fieldname]"' +
			                    'v-bind="subfield">' +
							'</component>' + 
						'</fieldset>' +
							'<component v-else' +
			            	    ' :key="fieldname"' +
			                	' :is="selectComponent(fielddefinition)"' +
			                	' :errors="errors"' +
			                	' :name="fieldname"' +
			                	' v-model="formdata[fieldname]"' +
			                	' v-bind="fielddefinition">' +
							'</component>' + 
					'</div>' +					
					'<div class="large"><button ref="submitsettings" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
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
		getFieldClass: function(field)
		{
			if(field.type == 'fieldset')
			{ 
				return; 
			}
			else if(field.class === undefined )
			{
				return 'large';
			}
			else
			{
				var fieldclass = field.class;
				delete field.class;
				return fieldclass;
			}
		},	
		selectComponent: function(field)
		{
			return 'component-'+field.type;
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
	props: ['navigation', 'errors', 'formdata', 'layouts'],
	data: function(){
		return {
			booklayout: { 'customforms': false },
			headlines: false,
		}
	},	
   	template: '<div>' +
   				'<form>' +
		   			'<div class="large">' +
			   			'<label>Select content from navigation</label>'+
			   			'<div class="tableofcontents">'+
			   				'<button @click.prevent="reset()" class="button bg-tm-green white bn br2 mb3 pointer">Load Latest Content Tree</button>'+
							'<div v-if="basefolder()"><label class="control-group">Exclude the base folder from eBook' +
								'<input type="checkbox" name="excludebasefolder" @change="toggleBaseFolder()" v-model="formdata.excludebasefolder" />' +
								'<span class="checkmark"></span>' +
							'</label><hr></div>' +
			   				'<list :navigation="navigation"></list>'+
			   			'</div>'+
			   			'<p>* All pages are included by default. You can exclude pages from the ebook by deselecting them. If you deselect a folder, all sub-items will be excluded, too. If you want to change the structure or the order, then please change it in the navigation of the webside.</p>'+
			   		'</div>' +
					'<fieldset class="subfield">' +
						'<legend>Downgrade Headlines</legend>' +
						'<div class="large" :class="{ error : errors.downgradeheadlines }">' +
							'<label for="">Downgrade Headlines</label>' +
							'<label class="control-group">Downgrade Headlines starting with the first sub-page-level.' +
								'<input type="radio" id="first" value="1" v-model="formdata.downgradeheadlines" checked/>' +
								'<span class="radiomark"></span>' +
							'</label>' +
							'<label class="control-group">Downgrade Headlines starting with the second sub-page-level.' +
								'<input type="radio" id="second" value="2" v-model="formdata.downgradeheadlines" />' +
								'<span class="radiomark"></span>' +
							'</label>' +
							'<label class="control-group">Downgrade Headlines starting with the third sub-page-level.' +
								'<input type="radio" id="third" value="3" v-model="formdata.downgradeheadlines" />' +
								'<span class="radiomark"></span>' +
							'</label>' +
							'<label class="control-group">Do not downgrade headlines at all.' +
								'<input type="radio" id="none" value="0" v-model="formdata.downgradeheadlines" />' +
								'<span class="radiomark"></span>' +
							'</label>' +
							'<div class="description">To keep the chapter structure in the eBook consistent, Typemill will downgrade the headlines of sub-pages according to the position in the navigation hierarchy. To understand the logic, you can experiment with this setting and use the headline preview below.</div>' +
						'</div>' + 
					'</fieldset>' +
					'<fieldset class="subfield">' +
						'<legend>Preview Headline Hierarchy</legend>' +
						'<div class="large">' +
							'<div class="description">You can preview the headline hierarchy here. If something looks wrong, then check the headline levels in the content pages and review the feature "downgrade headlines" above.</div>' +
							'<div><button @click.prevent="headlinepreview" class="button bn br2 bg-tm-green white mt3" type="submit">Generate Headline Preview</button></div>' +
							'<div v-if="headlines">' +
								'<ul class="pa0 list">' +
									'<li v-for="headline in headlines"><span class="tm-green" :class="addLevelClass(headline.level)">{{ headline.name }}</span> {{ headline.text }}</li>' +
								'</ul>' +
							'</div>' +
						'</div>' + 
					'</fieldset>' +
					'<div class="large"><button @click="submitstep" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
   			'</div>',
	mounted: function(){
		this.booklayout = this.layouts[this.formdata.layout];

		if(this.formdata.excludebasefolder)
		{
			this.$parent.excludeBaseFolder();			
		}

		this.$parent.storeEbookData();
	},
	methods: {
		reset: function()
		{
			this.$parent.resetNavigation();
		},
		submitstep: function()
		{
			this.$parent.submit('epub');
		},
		addLevelClass: function(level)
		{
			return 'level-' + level;
		},
		basefolder: function()
		{
			if(this.navigation.length == 1 && this.navigation[0].folderContent)
			{
				return true;
			}
		},
		toggleBaseFolder: function()
		{
			this.$parent.excludeBaseFolder();
		},
		headlinepreview: function()
		{
			var self = this;

	        myaxios.post('/api/v1/headlinepreview',{
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
				'item': 		this.navigation,
				'ebookdata':  	this.formdata,
			})
 	       .then(function (response)
    	    {
    	    	self.headlines = response.data.headlines;
	        })
	        .catch(function (error)
	        {
		        self.message = error.response.data.errors.message;
	        	self.messagecolor = 'bg-tm-red';
	        });

		}
	}
});

Vue.component("list", {
	props: ['navigation'],
	data: function(){
		return {
			folder: 'folder'
		}
	},
   	template: '<ul class="contentselection">' +
   	 			'<li v-for="item in publishedItems" :class="item.class">' + 
					'<label class="control-group">{{item.name}}' +
					  '<input type="checkbox"' + 
						' :id="item.keyPath"' +
					    ' :name="item.name"' + 
					    ' :disabled="checkDisabled(item)"' + 					    
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
		checkDisabled: function(item)
		{
			console.info(item);
			if(item.disabled)
			{
				return "disabled";
			}
			return false;
		}
	},
});

Vue.component("ebook-epub", {
	props: ['errors', 'formdata', 'layouts'],
	data: function(){
		return {
			booklayout: { 'customforms': false },
		}
	},
 	template: '<div>' +
 				'<form id="epub" @submit.prevent="submitstep">' +
	 				'<fieldset class="subfield">' +
						'<legend>ePUB Identifier</legend>' +
						'<div class="large">Please add one identifier: either an ISBN, UUID or URI. If you add more than one identifiers, then the first will be used and the others will be ignored. Identifiers must be unique. Never change an identifier after you publishd/distributed a book, otherwise e-readers cannot identify the book anymore.</div>' +
						'<div class="large" :class="{ error : errors.epubidentifierisbn }">' +
							'<label for="epubidentifierisbn">Either ISBN</label>' +
							'<input id="epubidentifierisbn" name="epubidentifierisbn" type="text" v-model="formdata.epubidentifierisbn" maxlength="200" />' +
							'<div class="fielddescription"><small>You can get an ISBN here:  </small></div>' +
							'<span class="error" v-if="errors.epubidentifierisbn">{{ errors.epubidentifierisbn[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.epubidentifieruuid }">' +
							'<label for="epubidentifieruuid">Or UUID</label>' +
							'<input id="epubidentifieruuid" name="epubidentifieruuid" type="text" v-model="formdata.epubidentifieruuid" maxlength="200" />' +
							'<button class="uuid-button button bn br2 bg-tm-green white absolute" @click.prevent="generateUuid()" :disabled="checkUuidDisabled()">Generate UUID</button>' +
							'<div class="fielddescription"><small>You can generate an UUID version 4 with the button. Do not change it after you published a book.</small></div>' +
							'<span class="error" v-if="errors.epubidentifieruuid">{{ errors.epubidentifieruuid[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.epubidentifieruri }">' +
							'<label for="epubidentifieruri">Or URI</label>' +
							'<input id="epubidentifieruri" name="epubidentifieruri" type="text" v-model="formdata.epubidentifieruri" maxlength="200" />' +
							'<div class="fielddescription"><small>The URI should be a unique address (e.g an url) where the book is published.</small></div>' +
							'<span class="error" v-if="errors.epubidentifieruri">{{ errors.epubidentifieruri[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<fieldset class="subfield">' +
						'<legend>ePUB Meta Details</legend>' +
						'<component-image :value="formdata.epubcover" name="epubcover" label="Cover image for epub" description="Maximum size 5 MB. Must be jpeg format. Ideal size is 2,560 x 1,600 pixels." errors="errors.epubcover"></component-image>' +
						'<div class="large" :class="{ error : errors.epubdescription }">' +
							'<label for="title">Short eBook Description für the ePub</label>' +
							'<textarea @change="autosize()" rows="8" id="epubdescription" name="epubdescription" v-model="formdata.epubdescription" class="textareaclass" maxlength="1500"></textarea>' +
							'<span class="error" v-if="errors.epubdescription">{{ errors.epubdescription[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.epubsubjects }">' +
							'<label for="epubsubjects">Subjects/Tags</label>' +
							'<input id="epubsubjects" name="epubsubjects" type="text" v-model="formdata.epubsubjects" maxlength="200" />' +
							'<div class="description">Separate several subjects with comma.</div>' +
							'<span class="error" v-if="errors.epubsubjects">{{ errors.epubsubjects[0] }}</span>' +
						'</div>' +
						'<div class="medium" :class="{ error : errors.epubauthorfirstname }">' +
							'<label for="epubauthorfirstname">Author First Name</label>' +
							'<input id="epubauthorfirstname" name="epubauthorfirstname" type="text" v-model="formdata.epubauthorfirstname" maxlength="80" />' +
							'<span class="error" v-if="errors.epubauthorfirstname">{{ errors.epubauthorfirstname[0] }}</span>' +
						'</div>' +
						'<div class="medium" :class="{ error : errors.epubauthorlastname }">' +
							'<label for="epubauthorlastname">Author Last Name</label>' +
							'<input id="epubauthorlastname" name="epubauthorlastname" type="text" v-model="formdata.epubauthorlastname" maxlength="80" />' +
							'<span class="error" v-if="errors.epubauthorlastname">{{ errors.epubauthorlastname[0] }}</span>' +
						'</div>' +
						'<div class="medium" :class="{ error : errors.epubpublishername }">' +
							'<label for="epubpublishername">Publisher Name</label>' +
							'<input id="epubpublishername" name="epubpublishername" type="text" v-model="formdata.epubpublishername" maxlength="80" />' +
							'<span class="error" v-if="errors.epubpublishername">{{ errors.epubpublishername[0] }}</span>' +
						'</div>' +
						'<div class="medium" :class="{ error : errors.epubpublisherurl }">' +
							'<label for="epubpublisherurl">Publisher URL</label>' +
							'<input id="epubpublisherurl" name="epubpublisherurl" type="text" v-model="formdata.epubpublisherurl" maxlength="80" />' +
							'<span class="error" v-if="errors.epubpublisherurl">{{ errors.epubpublisherurl[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<fieldset class="subfield">' +
						'<legend>ePUP Navigation Details</legend>' +						
						'<div class="large" :class="{ error : errors.epubtocname }">' +
							'<label for="epubtocname">Name for "Table of Contents"</label>' +
							'<input id="epubtocname" name="epubtocname" type="text" v-model="formdata.epubtocname" maxlength="80" />' +
							'<span class="error" v-if="errors.epubtocname">{{ errors.epubtocname[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.epubtitlepage }">' +
							'<label for="epubtitlepage">Name for the titlepage</label>' +
							'<input id="epubtitlepage" name="epubtitlepage" type="text" v-model="formdata.epubtitlepage" maxlength="80" />' +
							'<span class="error" v-if="errors.epubtitlepage">{{ errors.epubtitlepage[0] }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.epubchapternumber }">' +
							'<label class="control-group">Prefix chapters with numbers automatically' +
								'<input type="checkbox" name="epubchapternumber" v-model="formdata.epubchapternumber" />' +
								'<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
						'<div class="large" :class="{ error : errors.epubchaptername }">' +
							'<label for="epubchaptername">Name for chapter in prefix</label>' +
							'<input id="epubchaptername" name="epubchaptername" type="text" v-model="formdata.epubchaptername" maxlength="80" />' +
							'<span class="error" v-if="errors.epubchaptername">{{ errors.epubchaptername[0] }}</span>' +
						'</div>' +
					'</fieldset>' +
						'<div class="large" :class="{ error : errors.epubdebug }">' +
							'<label class="control-group">Debug ePub (will append a report as last chapter)' +
								'<input type="checkbox" name="epubdebug" v-model="formdata.epubdebug" />' +
								'<span class="checkmark"></span>' +
							'</label>' +
						'</div>' + 
					'<div class="large"><button ref="submitepub" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
			  '</div>',
	mounted: function(){
		this.booklayout = this.layouts[this.formdata.layout];
		this.$parent.storeEbookData();
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
		checkUuidDisabled: function()
		{
			if(this.formdata.epubidentifieruuid === undefined)
			{
				return false;
			}
			else if(this.formdata.epubidentifieruuid != '')
			{
				return 'disabled';
			}
			return false;
		},
		generateUuid: function()
		{
			this.$parent.setUuid();
		}
	}
});

Vue.component("ebook-create", {
	props: ['errors', 'formdata', 'navigation', 'root'],
	data: function(){
		return {
			previewUrl: false,
			epubUrl: false,
		}
	},	
    template: '<div class="large">' + 
    			'<h2>Create the eBook</h2>' +
    			'<div class="flex">' +
    				'<div class="pagedjs w-50 mr3">' +
    					'<h3 class="f4 b">PDF Preview</h3>' +
		    			'<p>The button below will open a html-preview of the ebook in a separate page. You can download and save the ebook as pdf with your local printer driver.</p>' + 
		    			'<a :href="previewUrl" target="_blank" class="link button bn bg-tm-green dim dib mt3">Open PDF-Preview</a>' +
		    			'<h3 class="f4 b mt3">Limitations</h3>' +
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
		    			'<h3 class="f4 b mt3">Credits</h3>' +
		    			'<p>This feature uses the open source library <a href="https://www.pagedjs.org/" target="_blank">paged.js</a> by Cabbage Tree Labs (MIT-Licence).</p>' +
		    		'</div>' +
    				'<div class="epub w-50 ml3">' +
    					'<h3 class="f4 b">ePub Export</h3>' +
		    			'<p>The button below will generate an ePub 3 file. The download dialogue of your browser will open automatically.</p>' + 
		    			'<a :href="epubUrl" target="_blank" class="link button bn bg-tm-green dim dib mt3">Export ePub 3</a>' +
		    			'<h3 class="f4 b mt3">Limitations</h3>' +
		    			'<p>The ePub will support most of the common ePub-3 specifications, but some features might be missing.</p>' + 
		    			'<h3 class="f4 b mt3">Credits</h3>' +
		    			'<p>This feature uses the open source library <a href="https://github.com/Grandt/PHPePub" target="_blank">PHPePub</a> by Asbjørn Grandt (Licence LGPL 2.1)</p>' +
		    		'</div>' +
    		  '</div>',
	mounted: function(){

		this.previewUrl = this.$parent.getPreviewUrl();

		this.epubUrl = this.$parent.getEpubUrl();

		this.$parent.storeEbookData();

		this.$parent.tmpStoreItem();
	},
});