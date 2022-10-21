Vue.component('tab-ebooks', {
    props: ['saved', 'errors', 'data', 'schema', 'item'],
    template: '<section>' +
				'<div class="progressnav">' +
	    			'<button class="progressbutton"' +
	    				'v-for="tab in tabs"' +
	        			'v-bind:key="tab"' +
	        			'v-bind:class="getTabClass(tab)"' +
	        			'v-on:click="triggersubmit(tab)">' +
	        			'{{ tab }} <span v-if="tabErrors[tab]" class="tabalert">!</span>' +
	    			'</button>' +
				'</div>' +
				'<div class="large" v-if="message"><div class="w-100 tc pv2 mv2 white" :class="messagecolor">{{ message }}</div></div>' +
				'<component v-if="dataLoaded"' +
					'v-bind:is="currentTabComponent"' +
					'v-bind:formdata="formData"' +
					'v-bind:errors="errors"' +
				    'v-bind:layouts="layoutData"' +
				    'v-bind:navigation="navigation">' +
				'</component>' +
    		'</section>',
	data: function () {
		return {
			root: document.getElementById("main").dataset.url, /* get url of current page */
			currentTabComponent: "ebook-layout",
	       	currentTab: "layout",
	       	nextStep: false,
    	   	tabs: ["layout", "settings", "content", "epub", "create"],
			dataLoaded: false,
			navigation: {}, 
			standardForms: {}, /* holds the standard forms from layout that user has choosen from layoutData */
			customForms: {}, /* holds the custom forms from layout that user has choosen from layoutData */
			layoutData: {}, /* holds all the different eBook layouts */
			formData: {}, /* holds the input data for the forms */
			formErrors: {},
			formErrorsReset: {},
			tabErrors: {},
			message: '',
			messagecolor: '',
			initialize: true,
		}
	},
	mounted: function(){

		/* use item of page as default navigation */
		this.navigation = [this.item];

		var self = this;

        /* get the latest book data from ebook plugin api */
        /* we cannot use the "data" object of the tabs for this because the code strips out all metadata that are not defined with tab-forms in the plugin yaml file */
        /* In the ebook plugin we do not use form definitions in the plugin yaml, instead we use individual yamls for each layout */
        myaxios.get('/api/v1/ebooktabdata',{
        	params: {
				'url':			document.getElementById("path").value,
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
				'itempath': 	self.item.pathWithoutType,
        	}
		})
        .then(function (response)
        {
        	var ebookdata 		= response.data;

        	self.formData 		= ebookdata['formdata'];
        	self.layoutData 	= ebookdata['layoutdata'];

        	if(typeof self.formData.activeshortcodes == 'undefined')
        	{
	        	self.formData.activeshortcodes = [];
        	}

        	/* if there are no stored formdata yet */
        	if(!self.formData)
        	{
        		/* use the first layout in folder as the default layout and store it in formData */
				var defaultlayout = Object.keys(self.layoutData)[0];
        		self.formData = { 'layout': defaultlayout };

        		/* use the default item for content tree */
        		self.navigation = [self.item];

        	}
        	else if(self.formData.content && Object.keys(self.formData.content).length > 0)
        	{
        		/* use original item and mark all content as excluded that is not insode of stored formData */        		
        		var markedNavigation = self.markSelectedPages(self.navigation, self.formData.content, []);

        		self.navigation = markedNavigation;
        	}

        	self.dataLoaded = true;
        })
        .catch(function (error)
        {
	        self.message = error.response.data.errors.message;
        	self.messagecolor = 'bg-tm-red';
        });

		FormBus.$on('forminput', formdata => {
			this.$set(this.formData, formdata.name, formdata.value);
		});

		if (navigator.userAgent.indexOf('Chrome') == -1 || parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Chrome') + 7).split(' ')[0]) <= 88)
		{
	        this.message = 'For optimal results of the pdf-preview we recommend the browser chrome version 88 (minimum).';
        	this.messagecolor = 'bg-tm-red';
		}
	},
	methods: {
        selectComponent: function(field)
        {
            return 'component-'+field.type;
        },
        saveInput: function()
        {
            this.$emit('saveform');
        },
		triggersubmit: function(tab)
		{
			/* triggered by navigation */
			if(this.currentTab == 'layout')
			{
				this.storeCustomCSS();
			}

			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
			this.moveUp();
		},
		submit: function(tab)
		{
			/* triggered by navigation */
			if(this.currentTab == 'layout')
			{
				this.storeCustomCSS();
			}
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
			this.moveUp();
		},
		moveUp()
		{
			setTimeout(function(){ 
	       		window.scrollTo({
				  top: 0,
				  left: 0,
				  behavior: 'smooth'
				});

			}, 100);
      	},
		storeEbookData: function()
		{
			this.message = false;
			this.messagecolor = '';
			
			/* we only want to store a simple (and readable) tree of selected page names in the yaml file, not the whole item object */
			this.formData.content = this.extractSelectedContent(this.navigation,[]);

			var self = this;

	        myaxios.post('/api/v1/ebooktabdata',{
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
				'data': 		this.formData,
				'navigation': 	this.navigation,
				'item': 		this.item
			})
	        .then(function (response) {
	        	self.tabErrors = {};
	        })
	        .catch(function (error)
	        {
	        	if(error.response.status == 400)
	        	{
	        		self.message = 'You are probably logged out, please login again.';
        			self.messagecolor = 'bg-tm-red';
	        	}
	           	if(error.response.data.errors)
	            {
	        		self.message = 'We did not safe the book-data. Please correct the errors.';
        			self.messagecolor = 'bg-tm-red';
	        		self.formErrors = error.response.data.errors;
	        		self.checkTabStatus();
	            }
	        });
		},
		storeCustomCSS: function()
		{
			var customcss = this.layoutData[this.formData.layout].customcss;

			var self = this;

			myaxios.post('/api/v1/ebooklayoutcss',{
					'url':			document.getElementById("path").value,        		
					'csrf_name': 	document.getElementById("csrf_name").value,
					'csrf_value':	document.getElementById("csrf_value").value,
					'css': 			customcss,
					'layout': 		this.formData.layout
			})
			.then(function (response) {

			})
			.catch(function (error)
			{
			});
		},
		markSelectedPages: function(navigation, selectedPages, markedNavigation)
		{
			for(let i = 0; i < navigation.length; i++)
			{
				if(navigation[i].status == 'published')
				{
					/* find the item name in the selected pages */
					var selectIndex = this.findInObject(navigation[i].name, selectedPages);

					/* if page name is not in the selecte pages */					
					if(selectIndex === false)
					{
						/* then exclude the page */
						navigation[i].exclude = "true";
					}

					/* check if published, check if something in folder */
					if(navigation[i].elementType == "folder")
					{
						/* use empty array by default, so all sub-pages will be excluded */
						var selectedFolder = [];

						/* if the page has been found in selectedPages */
						if(selectIndex !== false && selectedPages[selectIndex].folderContent !== 'undefined')
						{
							/* then use the folder content */
							selectedFolder = selectedPages[selectIndex].folderContent;
						}

						navigation[i].folderContent = this.markSelectedPages( navigation[i].folderContent, selectedFolder, [] );
					}
				}
			}
			return navigation;
		},
		extractSelectedContent: function(navigation, selectedPages)
		{
			for(let i = 0; i < navigation.length; i++)
			{
				/* check if published and if not excluded */
				if(navigation[i].status == 'published' && (typeof navigation[i].exclude === 'undefined' || navigation[i].exclude === false ))
				{
					var item = {  };
					item.name = navigation[i].name; 

					/* check if something in folder */
					if(navigation[i].elementType == "folder")
					{
						item.folderContent = this.extractSelectedContent(navigation[i].folderContent,[]);
					}

					selectedPages.push(item);
				}
			}

			return selectedPages; 
		},
		excludeBaseFolder: function(exclude = null)
		{
			if(exclude)
			{
				this.$set(this.navigation[0], 'disabled', true)
			}
			else if(this.navigation[0].disabled)
			{
				this.$set(this.navigation[0], 'disabled', false)
			}
			else
			{
				this.$set(this.navigation[0], 'disabled', true)
			}
		},
		findInObject: function(name, myArray)
		{
		 	for (var i = 0; i < myArray.length; i++)
		 	{
		    	if (myArray[i].name === name)
		    	{
		    		return i;
		    	}
			}
			return false;
		},
		getTabClass: function(tab)
		{
			active = (this.currentTab === tab) ? ' active' : '';
			error = (this.tabErrors[tab]) ? ' error' : '';
			return 'tab-button ' + tab + active + error;
		},
		checkTabStatus: function()
		{
			this.tabErrors = {};

			var fronttab = ['title', 'subtitle', 'author', 'edition', 'imprint', 'dedication'];
			var contenttab = ['content'];
			var backtab = ['blurb'];
			var designtab = ['layout', 'primarycolor', 'secondarycolor', 'coverimage'];

			for(var error in this.formErrors)
			{
				if(fronttab.indexOf(error) > -1){ this.tabErrors.front = true; }
				if(backtab.indexOf(error) > -1){ this.tabErrors.back = true; }
				if(contenttab.indexOf(error) > -1){ this.tabErrors.content = true; }
				if(designtab.indexOf(error) > -1){ this.tabErrors.design = true; }
			}
		},
		getPreviewUrl: function()
		{
			return this.root + '/tm/ebooks/preview?itempath=' + this.item.pathWithoutType;
		},
		getEpubUrl: function()
		{
			return this.root + '/tm/ebooks/epub?itempath=' + this.item.pathWithoutType;
		},
		tmpStoreItem: function(format)
		{
			/* store the item inside array for compatibility with navigation structure */
			var storeitem = [this.item];

			self = this;

			/* temporary store the item here */
	        myaxios.post('/api/v1/ebooktabitem',{
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
				'item': 		storeitem
			})
	        .then(function (response) {

	        })
	        .catch(function (error)
	        {
	        	if(error.response.status == 400)
	        	{
	        		self.message = 'You are probably logged out, please login again.';
        			self.messagecolor = 'bg-tm-red';
	        	}
	           	if(error.response.data.errors)
	            {
	        		self.message = 'We could not store the temporary content file for the ebook.';
        			self.messagecolor = 'bg-tm-red';
	        		self.formErrors = error.response.data.errors;
	        		self.checkTabStatus();
	            }
	        });
		},
		setUuid: function()
		{
			self = this;

	        myaxios.get('/api/v1/epubuuid',{
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
			})
	        .then(function (response) {
				self.$set(self.formData, 'epubidentifieruuid', response.data.uuid);
	        })
	        .catch(function (error)
	        {
	        	if(error.response.status == 400)
	        	{
	        		self.message = 'You are probably logged out, please login again.';
        			self.messagecolor = 'bg-tm-red';
	        	}
	           	if(error.response.data.errors)
	            {
	        		self.message = 'We did not safe the book-data. Please correct the errors.';
        			self.messagecolor = 'bg-tm-red';
	        		self.formErrors = error.response.data.errors;
	        		self.checkTabStatus();
	            }
	        });
		},
		resetNavigation: function()
		{
			var self = this;

	        myaxios.get('/api/v1/article/metaobject',{
	        	params: {
					'url':			document.getElementById("path").value,        		
					'csrf_name': 	document.getElementById("csrf_name").value,
					'csrf_value':	document.getElementById("csrf_value").value,
	        	}
			})
	        .then(function (response) {

				self.item = response.data.item;
	        	self.navigation = [self.item];
	        })
	        .catch(function (error)
	        {
	           	if(error.response)
	            {
	            }
	        });
		},		
	}
});