/* Needed for image component integration */
const FormBus = new Vue();

let ebooks = new Vue({
    delimiters: ['${', '}'],
	el: '#ebooks',
	data: function () {
		return {
			root: document.getElementById("main").dataset.url, /* get url of current page */
			currentTabComponent: "ebook-general",
	       	currentTab: "general",
	       	nextStep: false,
    	   	tabs: ["general", "front", "content", "back", "create"],
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
			disabled: false,
		}
	},
	mounted: function(){

		var self = this;

        /* get the last book data */
        myaxios.get('/api/v1/ebookdata',{
        	params: {
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
        	}
		})
        .then(function (response)
        {
        	var ebookdata 		= response.data;

        	self.formData 		= ebookdata['formdata'];
        	self.layoutData 	= ebookdata['layoutdata'];

        	/* if there are no stored formdata yet */
        	if(!self.formData)
        	{
        		/* use the first layout in folder as the default layout and store it in formData */
				var defaultlayout = Object.keys(self.layoutData)[0];
        		self.formData = { 'layout': defaultlayout };
        	}

        	self.dataLoaded = true;
        	self.disabeld = false;
        })
        .catch(function (error)
        {
	        self.message = error.response.data.errors.message;
        	self.messagecolor = 'bg-tm-red';
        });

		/* always get the latest navigation (not the stored book navigation, because website navigation might have changed) */
        myaxios.get('/api/v1/ebooknavi',{
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
	        self.message = error.response.data.errors.message;
        	self.messagecolor = 'bg-tm-red';
        	self.disabled = false;
        	if(typeof error.response.data.errors.disable !== 'undefined')
        	{
	        	self.disabled = true;
        	}        	
        });

		FormBus.$on('forminput', formdata => {
			this.$set(this.formData, formdata.name, formdata.value);
		});
	},
	methods: {
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
				'navigation': 	this.navigation
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
			return this.root + '/tm/ebooks/preview';
		},
		tmpStoreItem: function()
		{
			return true;
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