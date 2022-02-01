let ebooks = new Vue({
    delimiters: ['${', '}'],
	el: '#ebooks',
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
			ebookprojects: false,
			currentproject: false,
			message: '',
			messagecolor: '',
			initialize: true,
			disabled: false,
		}
	},
	mounted: function(){

		/* set a default currentproject */
		this.currentproject = 'ebookdata.yaml';

		var self = this;

        /* get the ebook layouts */
        myaxios.get('/api/v1/ebooklayouts',{
        	params: {
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
        	}
		})
        .then(function (response)
        {
	        self.layoutData = response.data.layoutdata;

	        /* as default use the first layout in folder as the default layout and store it in formData */
			var defaultlayout = Object.keys(self.layoutData)[0];
	        self.formData = { 'layout': defaultlayout };
        })
        .catch(function (error)
        {
        });

        /* get the ebook projects */
        myaxios.get('/api/v1/ebookprojects',{
        	params: {
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
        	}
		})
        .then(function (response)
        {
        	var ebookprojects = response.data.ebookprojects;

			if(Array.isArray(ebookprojects) && ebookprojects.length > 0)
			{
				/* activate and load the first project */
				self.ebookprojects = ebookprojects;
				self.currentproject = self.ebookprojects[0];
				self.loadEbookProject();
			}
			else
			{
				/* add the default name for empty project */
				self.ebookprojects = ['ebookdata.yaml'];

			}
			self.dataLoaded = true;
			self.disabled = false;

        })
        .catch(function (error)
        {
        });

        /* load the default navigation */
        this.loadEbookNavi();

		FormBus.$on('forminput', formdata => {
			this.$set(this.formData, formdata.name, formdata.value);
		});
	},
	methods: {
		setCurrentProject: function(projectname)
		{
			this.currentproject = projectname;
		},
		createEbookProject: function(projectname)
		{
			this.ebookprojects.push(projectname);
			this.currentproject = projectname;
			
			/*	do you want to clear the forms or keep the data?		
			this.formData = {}; 
			*/
		},
		loadEbookProject: function()
		{
			self = this; 

	        /* get the last book data */
	        myaxios.get('/api/v1/ebookdata',{
	        	params: {
					'url':			document.getElementById("path").value,        		
					'csrf_name': 	document.getElementById("csrf_name").value,
					'csrf_value':	document.getElementById("csrf_value").value,
					'projectname':  this.currentproject
				}
			})
	        .then(function (response)
	        {
	        	var ebookdata 		= response.data;

	        	self.formData 		= ebookdata['formdata'];

	        	self.loadEbookNavi(self.currentproject);
	        })
	        .catch(function (error)
	        {
		        self.message = error.response.data.errors.message;
	        	self.messagecolor = 'bg-tm-red';
	        });
		},
		loadEbookNavi: function()
		{
			self = this;

			/* always get the latest navigation (not the stored book navigation, because website navigation might have changed) */
	        myaxios.get('/api/v1/ebooknavi',{
	        	params: {
					'url':			document.getElementById("path").value,        		
					'csrf_name': 	document.getElementById("csrf_name").value,
					'csrf_value':	document.getElementById("csrf_value").value,
					'projectname': 	this.currentproject 
	        	}
			})
	        .then(function (response){

	        	self.navigation = response.data.navigation;

	        })
	        .catch(function (error)
	        {
		        self.message = error.response.data.errors.message;
	        	self.messagecolor = 'bg-tm-red';
	        	self.disabled = false;
	        	if(typeof error.response.data.errors.disable !== 'undefined')
	        	{
		        	self.disabled = true;
	        	}        	
	        });
		},
		deleteEbookProject: function(ebookproject)
		{
			if(this.ebookprojects.indexOf(ebookproject) === -1)
			{
				this.message = 'This eBook-project does not exist.';
				return;
			}

			var self = this;

	        myaxios.delete('/api/v1/ebookdata',{
	        	data: {
					'url':			document.getElementById("path").value,        		
					'csrf_name': 	document.getElementById("csrf_name").value,
					'csrf_value':	document.getElementById("csrf_value").value,
					'projectname': 	ebookproject
	        	}
			})
 	        .then(function (response)
    	    {
				for( var i = 0; i < self.ebookprojects.length; i++)
				{ 
					if ( self.ebookprojects[i] === ebookproject)
					{
						self.ebookprojects.splice(i, 1);
						if(ebookproject == self.currentproject)
						{
							self.currentproject = self.ebookprojects[0];
							self.loadEbookProject();
						}
						break;
					}
				}
	        })
	        .catch(function (error)
	        {
		        self.message = error.response.data.errors.message;
	        	self.messagecolor = 'bg-tm-red';
	        });

		},
		triggersubmit: function(tab)
		{
			window.scrollTo({
				top: 0,
				left: 0, 
				behavior: 'smooth'
			});
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
		},
		submit: function(tab)
		{
			window.scrollTo({
				top: 0,
				left: 0, 
				behavior: 'smooth'
			});			
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
		},
		storeEbookData: function()
		{
			this.message = false;
			this.messagecolor = '';

			var self = this;

	        myaxios.post('/api/v1/ebookdata',{
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
				'data': 		this.formData,
				'navigation': 	this.navigation,
				'projectname': 	this.currentproject
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
		getTabClass: function(tab)
		{
			active = (this.currentTab === tab) ? ' active' : '';
			error = (this.tabErrors[tab]) ? ' error' : '';
			return 'tab-button ' + tab + active + error;
		},
		checkTabStatus: function()
		{
			this.tabErrors = {};

			var fronttab = ['title', 'subtitle', 'author', 'edition', 'imprint', 'dedication', 'primarycolor', 'secondarycolor', 'coverimage'];
			var contenttab = ['content'];
			var backtab = ['blurb'];
			var generaltab = ['layout'];

			for(var error in this.formErrors)
			{
				if(fronttab.indexOf(error) > -1){ this.tabErrors.front = true; }
				if(backtab.indexOf(error) > -1){ this.tabErrors.back = true; }
				if(contenttab.indexOf(error) > -1){ this.tabErrors.content = true; }
				if(generaltab.indexOf(error) > -1){ this.tabErrors.general = true; }
			}
		},
		getPreviewUrl: function()
		{
			return this.root + '/tm/ebooks/preview?projectname=' + this.currentproject;
		},
		getEpubUrl: function()
		{
			return this.root + '/tm/ebooks/epub';
		},		
		tmpStoreItem: function()
		{
			return true;
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

			/* always get the latest navigation (not the stored book navigation, because website navigation might have changed) */
	        myaxios.get('/api/v1/navigation',{
	        	params: {
					'url':			document.getElementById("path").value,        		
					'csrf_name': 	document.getElementById("csrf_name").value,
					'csrf_value':	document.getElementById("csrf_value").value,
	        	}
			})
	        .then(function (response) {

	        	self.navigation = response.data.data;

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