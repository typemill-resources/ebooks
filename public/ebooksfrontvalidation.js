/* Needed for image component integration */
const FormBus = new Vue();

Vue.component("tab-front", {
	props: ['errors', 'data', 'class'],
 	template: '<div>' +
 				'<form id="front" @submit.prevent="submitstep">' +
	 				'<fieldset>' +
						'<div class="large" :class="{ error : errors.title }">' +
							'<label for="title">Title*</label>' +
							'<input @input="validate(title)" id="title" name="title" type="text" v-model="data.title" value="{{data.title}}" maxlength="10" required />' +
							'<span class="error" v-if="errors.title">{{ errors.title }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.subtitle }">' +
							'<label for="subtitle">Subtitle</label>' +
							'<input id="subtitle" name="subtitle" type="text" v-model="data.subtitle" value="{{data.subtitle}}" />' +
							'<span class="error" v-if="errors.subtitle">{{ errors.subtitle }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.author }">' +
							'<label for="author">Author*</label>' +
							'<input id="title" name="author" type="text" v-model="data.author" value="{{data.author}}" required />' +
							'<span class="error" v-if="errors.author">{{ errors.author }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.edition }">' +
							'<label for="edition">Edition</label>' +
							'<input id="edition" name="edition" type="text" v-model="data.edition" value="{{data.edition}}" />' +
							'<span class="error" v-if="errors.edition">{{ errors.edition }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.imprint}">' +
							'<label for="title">Imprint*</label>' +
							'<textarea @change="autosize()" rows="8" id="imprint" name="imprint" v-model="data.imprint" value="{{data.imprint}}" class="textareaclass" required ></textarea>' +
							'<span class="error" v-if="errors.imprint">{{ errors.imprint }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.dedication}">' +
							'<label for="title">Dedication</label>' +
							'<textarea @change="autosize()" rows="8" id="dedication" name="dedication" v-model="data.dedication" value="{{data.dedication}}" class="textareaclass"></textarea>' +
							'<span class="error" v-if="errors.dedication">{{ errors.dedication }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<div class="large"><button ref="submitfront" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
			'</div>',
	mounted: function(){
		if(!this.$parent.initialize)
		{
			this.$parent.storeEbookData();
		}
		this.$parent.initialize = false;

		/* listen to the event 'front' that is triggered if user clicks on front tab in head-navigation */
	    FormBus.$on('front', tab => {
	      	this.$refs.submitfront.click();
	    });

		this.$nextTick(() => {
			this.autosize();
		});
	},
	methods: {
		validate: function(field)
		{
			/* use the html5 field validation for error messages */
			this.errors[field.name] = false;
			if(field.validationMessage != '')
			{
				this.errors[field.name] = field.validationMessage;
			}
		},
		submitstep: function()
		{
			/* if next step has not been set */
			if(!this.$parent.nextstep)
			{
				/* then navigate to this tab */
				this.$parent.nextstep = 'content';
			}
			this.$parent.submit();
		},
		autosize: function()
		{
			autosize(document.querySelector('textarea'));
		},
	},
});

Vue.component("list", {
	props: ['navigation'],
	data: function(){
		return {
			folder: 'folder'
		}
	},
   	template: '<ul>' +
   	 			'<li v-for="item in navigation" :class="item.class">' + 
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

Vue.component("tab-content", {
	props: ['navigation'],
   	template: '<div class="large">' +
 				'<form id="content" @submit.prevent="submitstep">' +
	   				'<label>Select content from navigation</label>'+
	   				'<div class="tableofcontents">'+
	   					'<button @click="reset()" class="button bg-tm-green white bn br2 mb3 pointer">Load Latest Content Tree</button>'+
	   					'<list :navigation="navigation"></list>'+
	   				'</div>'+
	   				'<p>* All pages are included by default. You can exclude pages from the ebook by deselecting them. If you deselect a folder, all sub-items will be excluded, too. If you want to change the structure or the order, then please change it in the navigation of the webside.</p>'+
					'<div class="large"><button ref="submitcontent" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
   				'</form>' +
   			'</div>',
	mounted: function(){
		this.$parent.storeEbookData();

		/* listen to the event 'front' that is triggered if user clicks on front tab in head-navigation */
	    FormBus.$on('content', tab => {
	      	this.submitstep();
	    });

	},
	methods: {
		reset: function()
		{
			this.$parent.resetNavigation();
		},
		submitstep: function()
		{
			if(!this.$parent.nextstep)
			{
				this.$parent.nextstep = 'back';
			}
			this.$parent.submit();
		},
	}
});

Vue.component("tab-back", {
	props: ['errors', 'data', 'class'],
 	template: '<div>' +
 				'<form id="back" @submit.prevent="submitstep">' +
	 				'<fieldset>' +
						'<div class="large" :class="{ error : errors.blurb}">' +
							'<label for="blurb">Blurb*</label>' +
							'<textarea @change="autosize()" rows="8" id="blurb" name="blurb" v-model="data.blurb" value="{{data.blurb}}" class="textareaclass" required ></textarea>' +
							'<span class="error" v-if="errors.blurb">{{ errors.blurb }}</span>' +
						'</div>' +
					'</fieldset>' +
					'<div class="large"><button ref="submitback" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +
			  '</div>',
	mounted: function(){
		this.$parent.storeEbookData();

		/* listen to the event 'front' that is triggered if user clicks on front tab in head-navigation */
	    FormBus.$on('back', tab => {
	      	this.$refs.submitback.click();
	    });

		this.autosize();
	},
	methods: {
		submitstep: function()
		{
			if(!this.$parent.nextstep)
			{
				this.$parent.nextstep = 'design';
			}
			this.$parent.submit();
		},
		autosize: function()
		{
			autosize(document.querySelector('textarea'));
		},
	},
});

Vue.component("tab-design", {
	props: ['errors', 'data', 'class'],
	data: function(){
		return {
			src: 'plugins/ebooks/booklayouts/',
			cover: false,
			booklayout: false,
		}
	},
 	template: '<div class="ebookcover">' +
 				'<form id="design" @submit.prevent="submitstep">' +
	 				'<fieldset>' +
						'<div class="large half"><img class="coverpreview" :src="cover"></div>' +
						'<div class="large half" :class="{ error : errors.design}">' +
							'<label>Select a book design</label>' +
							'<div v-for="details,layout in data.booklayouts">' +
								'<label class="control-group">{{ layout }}' +
									'<input @change="changeCover()" type="radio" name="design" v-model="data.layout" :value="layout" />' +
								  	'<span class="radiomark"></span>' +
								'</label>' +
							'</div>' +
							'<div class="layoutinfo" v-if="booklayout">' + 
								'<div class="label">About this layout</div>' +
								'<ul>' +
									'<li v-for="info,name in booklayout"><span class="infokey">{{ name }}:</span><a v-if="name == \'Link\'" :href="info">{{ info }}</a><span v-else>{{ info }}</span></li>' +
								'</ul>' +
							'</div>' +
						  	'<span class="error" v-if="errors.layout">{{ errors.layout }}</span>' +
						'</div>' + 
						'<div class="large" :class="{ error : errors.primarycolor }">' +
							'<label for="primarycolor">Primary Background Color</label>' +
							'<input id="primarycolor" name="primarycolor" type="text" v-model="data.primarycolor" value="{{data.primarycolor}}" placeholder="lightblue" />' +
							'<div class="description">Use html color name or HEX code starting with #. Background colors are not supported by all book themes.</div>' +
							'<span class="error" v-if="errors.primarycolor">{{ errors.primarycolor }}</span>' +
						'</div>' +
						'<div class="large" :class="{ error : errors.secondarycolor }">' +
							'<label for="primarycolor">Secondary Background Color</label>' +
							'<input id="secondarycolor" name="secondarycolor" type="text" v-model="data.secondarycolor" value="{{data.secondarycolor}}" placeholder="#333333" />' +
							'<div class="description">Use html color name or HEX code starting with #. Background colors are not supported by all book themes.</div>' +
							'<span class="error" v-if="errors.secondarycolor">{{ errors.secondarycolor }}</span>' +
						'</div>' +
						'<component-image :value="data.coverimage" name="coverimage" label="Background image for the cover" description="Maximum size 5 MB. Background images are not supported by all book designs." errors="false"></component-image>' +
						'<div class="large" :class="{ error : errors.coverimageonly}">' +
							'<label class="control-group">Use only the background image and hide all other content on the cover' +
								'<input type="checkbox" name="design" v-model="data.coverimageonly" />' +
								 '<span class="checkmark"></span>' +
							'</label>' +
						  	'<span class="error" v-if="errors.layout">{{ errors.layout }}</span>' +
						'</div>' + 				
					'</fieldset>' + 
					'<div class="large"><button ref="submitdesign" class="button bn br2 bg-tm-green white" type="submit">Next step</button></div>' +
				'</form>' +		
			  '</div>',
	mounted: function(){
		this.cover = this.src + this.data.layout + '/cover.png';
		this.booklayout = this.data.booklayouts[this.data.layout];
		this.$parent.storeEbookData();

		/* listen to the event 'front' that is triggered if user clicks on front tab in head-navigation */
	    FormBus.$on('design', tab => {
	     	this.$refs.submitdesign.click();
	    });
	},
	methods: {
		changeCover: function(details)
		{
			this.cover = this.src + this.data.layout + '/cover.png';
			this.booklayout = this.data.booklayouts[this.data.layout];
		},
		getCover: function(layout)
		{
			return this.src + layout + '/cover.png';
		},
		submitstep: function()
		{
			if(!this.$parent.nextstep)
			{
				this.$parent.nextstep = 'create';
			}
			this.$parent.submit();
		},
	}
});

Vue.component("tab-create", {
	props: ['errors', 'data', 'navigation', 'class', 'root'],
    template: '<div class="large">' + 
    			'<h2>Create the ebook</h2>' +
    			'<p>Right now you can only create a pdf. Formats like ePub will follow.</p>' +  
    			'<p>The button below will open the ebook in a new html-page. You can download and save the ebook as pdf with your printer driver. Please upload the pdf to the folder "data/ebooks".</p>' + 
    			'<a :href="getUrl()" target="_blank" class="link button bn bg-tm-green dim dib mt3">Create ebook (HTML/PDF)</a>' +
    		  '</div>',
	mounted: function(){
		this.$parent.storeEbookData();
	    FormBus.$on('create', tab => {
	     	this.submitstep();
	    });		
	},
	methods: {
		getUrl: function()
		{
			return this.$parent.root + '/tm/ebooks/preview'
		},
		submitstep: function()
		{
			this.$parent.submit();
		},
	}
});

let ebooks = new Vue({
    delimiters: ['${', '}'],
	el: '#ebooks',
	data: function () {
		return {
			root: document.getElementById("main").dataset.url, /* get url of current page */
			currentTabComponent: "tab-front",
	       	currentTab: "front",
	       	nextStep: false,
    	   	tabs: ["front", "content", "back", "design", "create"],
			formData: {},
			formErrors: {},
			formErrorsReset: {},
			navigation: {},
			initialize: true,
		}
	},
	mounted: function(){

		var self = this;

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
           	if(error.response)
            {
            }
        });

        /* get the last book data */
        myaxios.get('/api/v1/ebookdata',{
        	params: {
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
        	}
		})
        .then(function (response) {

        	self.formData = JSON.parse(response.data.data);

        })
        .catch(function (error)
        {
           	if(error.response)
            {
            }
        });

		FormBus.$on('forminput', formdata => {
			this.$set(this.formData, formdata.name, formdata.value);
		});
	},
	methods: {
		triggersubmit: function(tab)
		{
			/* store the next step */
			this.nextstep = tab;

			/* this triggers the form-submit of the tab-component.
			 * the event has the same name like the tab
			 * each component listens to this events
			 * and triggers the submit button if the event = component-name 
			 * This way html-validation for the form is triggered 
			 * we will pass the currentTab = tab that is active right now
			 * and we will pass the tab = tab the user wants to go to
			*/
       		FormBus.$emit(this.currentTab);
		},
		submit: function()
		{
			console.info('next step: ' + this.nextstep);
			this.currentTab = this.nextstep;
			this.currentTabComponent = 'tab-' + this.nextstep;
			this.nextstep = false;
		},
		storeEbookData: function()
		{
			var self = this;

	        myaxios.post('/api/v1/ebookdata',{
				'url':			document.getElementById("path").value,        		
				'csrf_name': 	document.getElementById("csrf_name").value,
				'csrf_value':	document.getElementById("csrf_value").value,
				'data': 		this.formData,
				'navigation': 	this.navigation
			})
	        .then(function (response) {

	        	console.info(response);
	        })
	        .catch(function (error)
	        {
	           	if(error.response)
	            {
	            	console.info(error.response);
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