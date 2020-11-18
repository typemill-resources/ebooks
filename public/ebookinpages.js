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
/*    template: '<section> 
                '<div v-if="saved" class="metaLarge"><div class="metaSuccess">Saved successfully</div></div>' +
                '<div v-if="errors" class="metaLarge"><div class="metaErrors">Please correct the errors above</div></div>' +
                '<div class="large"><input type="submit" @click.prevent="saveInput" value="save"></input></div>' +
              '</form></section>',	*/
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
		}
	},
	mounted: function(){

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

        	/* if there are no stored formdata yet */
        	if(!self.formData)
        	{
        		/* use the first layout in folder as the default layout and store it in formData */
				var defaultlayout = Object.keys(self.layoutData)[0];
        		self.formData = { 'layout': defaultlayout };
        	}

        	self.dataLoaded = true;
        })
        .catch(function (error)
        {
	        self.message = error.response.data.errors.message;
        	self.messagecolor = 'bg-tm-red';
        });


        /* get the metayaml here and use as input data */


        /* get the item here and use as ebooknavi */



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
        });

		FormBus.$on('forminput', formdata => {
			this.$set(this.formData, formdata.name, formdata.value);
		});
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
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
		},
		submit: function(tab)
		{
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
		},
		storeEbookData: function()
		{
			this.message = false;
			this.messagecolor = '';

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