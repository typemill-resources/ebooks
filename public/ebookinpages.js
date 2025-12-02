app.component('tab-ebooks', {
	props: ['item', 'formData', 'formDefinitions', 'saved', 'errors', 'message', 'messageClass'],
	template: `<section class="dark:bg-stone-700 dark:text-stone-200">
					<h1 class="text-3xl font-bold mb-4">eBook Studio</h1>
					<div v-if="false">
						<p class="font-bold py-3">Welcome the eBook studio of Typemill.</p>
						<p class="py-3">The homepage does not support eBook generation, but you can generate eBooks from all other folders and pages. If you want to create (multiple) eBook-projects with all pages, then use the eBook-feature in the settings-area.</p>
						<p class="py-3">Happy publishing!</p>
					</div>
					<form v-else class="inline-block w-full">
						<ul class="flex flex-wrap mt-4 mb-4">
							<li v-for="tab in tabs">
								<button 
									class="px-2 py-2 border-b-2 border-stone-200 dark:border-stone-900 hover:border-stone-700 hover:dark:border-stone-200 hover:bg-stone-200 hover:dark:bg-stone-900 transition duration-100" 
									:class="(tab == currentTab) ? 'border-stone-700 bg-stone-200 dark:bg-stone-900 dark:border-stone-200' : ''" 
									@click.prevent="activateTab(tab)"
								>{{ $filters.translate(tab) }}</button>
							</li>
						</ul>
						<div v-if="dataLoaded">
							<component
								:is 				= "currentTabComponent"
								:errors 			= "formErrors"
								:formdata 			= "formData"
								:layouts 			= "layoutData"
								:navigation 		= "navigation"
								:ebookprojects 		= "ebookprojects"
								:currentproject 	= "currentproject"
								:message  			= "message"
								:messageClass 		= "messageClass"
								:previewUrl 		= "previewUrl"
								:epubUrl 			= "epubUrl"
								:shortcodes  		= "shortcodes"
								@change-project 	= "setCurrentProject"
								@create-project 	= "createEbookProject"
								@delete-project 	= "deleteEbookProject"
								@save-project		= "storeEbookData"
								@reset-navigation 	= "resetNavigation"
								@generate-uuid 		= "setUuid"
								@toggle-basefolder 	= "toggleBaseFolder"
								@store-tmp-item 	= "storeTmpItem"
							></component>
						</div>
					</form>
				</section>`,
	data: function () {
		return {
			home: false,
			tabs: ["content", "pdf", "epub"],
			currentTab: "content",
			currentTabComponent: "ebook-content",
			dataLoaded: false,

			navigation: [], 
			layoutData: {}, /* holds all the different eBook layouts */
			formData: {}, /* holds the input data for the forms */
			formErrors: {},
			ebookprojects: ['ebookdata.yaml'],
			currentproject: false,
			shortcodes: false,
			message: '',
			messageClass: '',

			previewUrl:  data.urlinfo.baseurl + '/tm/ebooks/preview?itempath=' + this.item.pathWithoutType,
			epubUrl:  data.urlinfo.baseurl + '/tm/ebooks/epub?itempath=' + this.item.pathWithoutType,
		}
	},
	mounted: function(){

		eventBus.$on('forminput', formdata => {
			this.formData[formdata.name] = formdata.value;
		});

		/* use item of page as default navigation */

		this.navigation = [this.item];

		var self = this;

		/* get the latest book data from ebook plugin api */
		/* we cannot use the "data" object of the tabs for this because the code strips out all metadata that are not defined with tab-forms in the plugin yaml file */
		/* In the ebook plugin we do not use form definitions in the plugin yaml, instead we use individual yamls for each layout */
		tmaxios.get('/api/v1/ebooktabdata',{
			params: {
				'url':			data.urlinfo.route,
				'itempath': 	self.item.pathWithoutType,
			}
		})
		.then(function (response)
		{
			var ebookdata 		= response.data;

			self.formData 		= ebookdata['formdata'];
			self.layoutData 	= ebookdata['layoutdata'];

			/* only if it is a homepage, the navigation is send */
			if(ebookdata['navigation'])
			{
				self.navigation = ebookdata['navigation'];
			}
			else
			{
				self.navigation = [self.item];
			}

			self.formData.activeshortcodes = Array.isArray(self.formData.activeshortcodes)
			    ? self.formData.activeshortcodes
			    : [];

			/* if there are no stored formdata yet */
			if(!self.formData)
			{
				/* use the first layout in folder as the default layout and store it in formData */
				var defaultlayout = Object.keys(self.layoutData)[0];
				self.formData = { 'layout': defaultlayout };

				/* use the default item for content tree 
				self.navigation = [self.item];
				*/
			}
			else if(self.formData.content && Object.keys(self.formData.content).length > 0)
			{
				/* use original item and mark all content as included that are part of stored formData */
				var markedNavigation = self.markSelectedPages(self.navigation, self.formData.content, []);

				self.navigation = markedNavigation;
			}

			self.toggleBaseFolder();

			self.dataLoaded = true;
		})
		.catch(function (error)
		{
			if(error.response)
			{
				self.message = handleErrorMessage(error);
				self.messageClass = 'bg-rose-500';
				if(error.response.data.errors !== undefined)
				{
					self.formErrors = error.response.data.errors;
				}
				if(error.response.data.home)
				{
					self.home = true;
				}
			}
		});

		tmaxios.get('/api/v1/shortcodedata',{
			'url':	data.urlinfo.route
		})
		.then(function (response)
		{
			self.shortcodes = response.data.shortcodedata;
		})
		.catch(function (error)
		{
			if(error.response)
			{
				self.message = handleErrorMessage(error);
				self.messageClass = 'bg-rose-500';
				self.formErrors = error.response.data.errors;
			}
		});

/*
		if (navigator.userAgent.indexOf('Chrome') == -1 || parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Chrome') + 7).split(' ')[0]) <= 88)
		{
			this.message = 'For optimal results of the pdf-preview we recommend the browser chrome version 88 (minimum).';
			this.messagecolor = 'bg-tm-red';
		}
*/
	},
	methods: {
		activateTab(tab)
		{
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
			this.reset();
		},
		reset()
		{
			this.errors 			= {};
			this.message 			= '';
			this.messageClass		= '';
		},
		storeEbookData(css)
		{
			this.reset();
			
			/* we only want to store a simple (and readable) tree of selected page names in the yaml file, not the whole item object */
			this.formData.content = this.extractSelectedContent(this.navigation,[]);

			var self = this;

			tmaxios.post('/api/v1/ebooktabdata',{
				'url':			data.urlinfo.route,
				'data': 		this.formData,
				'item': 		this.item
			})
			.then(function (response) {
				self.messageClass = "bg-teal-500";
				self.message = "Data stored successfully";
				self.formErrors = {};
				if(css)
				{
					self.storeCustomCSS();
				}				
			})
			.catch(function (error)
			{
				if(error.response)
				{
					self.message = handleErrorMessage(error);
					self.messageClass = 'bg-rose-500';
					self.formErrors = error.response.data.errors;
				}
			});
		},
		storeCustomCSS()
		{
			var customcss = this.layoutData[this.formData.layout].customcss;

			var self = this;

			tmaxios.post('/api/v1/ebooklayoutcss',{
				'url':			data.urlinfo.route,
				'css': 			customcss,
				'layout': 		this.formData.layout
			})
			.then(function (response) {
			})
			.catch(function (error)
			{
				if(error.response)
				{
					self.message = 'Could not store the custom css';
					self.messageClass = 'bg-rose-500';
				}
			});
		},
		storeTmpItem: function(format)
		{
			/* store the item inside array for compatibility with navigation structure */
			var storeitem = [this.item];
			/* only if it is a homepage, the navigation is send */
			if(this.navigation)
			{
				var storeitem = this.navigation;
			}

			self = this;

			/* temporary store the item here */
			tmaxios.post('/api/v1/ebooktabitem',{
				'url':	data.urlinfo.route,
				'item': storeitem
			})
			.then(function (response) {

			})
			.catch(function (error)
			{

			});
		},
		setUuid()
		{
			if(this.formData.epubidentifieruuid && this.formData.epubidentifieruuid != '')
			{
				this.formErrors.epubidentifieruuid = 'You already have an uuid. Please delete it before you create a new one.';

				return;
			}

			delete this.formErrors.epubidentifieruuid;

			self = this;

			tmaxios.get('/api/v1/epubuuid',{
				'url':	data.urlinfo.route,
			})
			.then(function (response) {
				self.formData.epubidentifieruuid = response.data.uuid;
			})
			.catch(function (error)
			{
				if(error.response)
				{
					self.message = handleErrorMessage(error);
					self.messageClass = 'bg-rose-500';
					self.formErrors = error.response.data.errors;
				}
			});
		},
		toggleBaseFolder()
		{
			/* endable/disable basefolder in navigation according to basefolder setting (true/false) */
			this.navigation[0].include = true;
			this.navigation[0].disabled = this.formData.excludebasefolder;

			/* regenerate headline preview */
			eventBus.$emit('createHeadlinePreview');			
		},
		markSelectedPages(navigation, selectedPages, markedNavigation)
		{
			for(let i = 0; i < navigation.length; i++)
			{
				/* do not include by default */
				navigation[i].include = false;

				if(navigation[i].status == 'published')
				{
					/* find the item name in the selected pages */
					var selectIndex = this.findInObject(navigation[i].name, selectedPages);

					/* if page name is in the selecte pages */					
					if(selectIndex !== false)
					{
						/* then include the page */
						navigation[i].include = true;
					}

					/* check if published, check if something in folder */
					if (
						navigation[i].elementType === "folder" &&
						Array.isArray(navigation[i].folderContent) &&
						navigation[i].folderContent.length > 0
					)
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
		extractSelectedContent(navigation, selectedPages)
		{
			for(let i = 0; i < navigation.length; i++)
			{				
				/* check if published and if not excluded */
				if(navigation[i].status == 'published' && (navigation[i].include == true))
				{
					var item = {  };
					item.name = navigation[i].name; 

					/* check if something in folder */
					if (
						navigation[i].elementType === "folder" &&
						Array.isArray(navigation[i].folderContent) &&
						navigation[i].folderContent.length > 0
					)
					{
						item.folderContent = this.extractSelectedContent(navigation[i].folderContent,[]);
					}

					selectedPages.push(item);
				}
			}

			return selectedPages; 
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
		resetNavigation: function()
		{
			/* only reset, because the item is already fresh */
			this.formData.content = [];
			this.formData.excludebasefolder = false;
			var test = this.markSelectedPages(this.navigation, this.formData.content, []);

			console.info(test);

			this.toggleBaseFolder();
		},		
	}
});