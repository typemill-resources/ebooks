const app = Vue.createApp({
	template: `<Transition name="initial" appear>
					<div>
						<h1 class="text-3xl font-bold mb-4">eBook Studio</h1>
						<form class="inline-block w-full">
							<ul class="flex flex-wrap mt-4 mb-4">
								<li v-for="tab in tabs">
									<button 
										class="px-2 py-2 border-b-2 border-stone-200 dark:border-stone-900 hover:border-stone-700 hover:dark:border-stone-200 hover:bg-stone-200 hover:dark:bg-stone-900 transition duration-100" 
										:class="(tab == currentTab) ? 'border-stone-700 bg-stone-200 dark:bg-stone-900 dark:border-stone-200' : ''" 
										@click.prevent="activateTab(tab)"
									>{{ $filters.translate(tab) }}</button>
								</li>
							</ul>
							<div>
								<component
									:is 				= "currentTabComponent"
									:errors 			= "formErrors"
									:formdata 			= "formData"
									:layouts 			= "layoutData"
									:navigation 		= "navigation"
									:webprojects 		= "webprojects"
									:currentwebproject 	= "currentwebproject"
									:ebookprojects 		= "ebookprojects"
									:currentproject 	= "currentproject"
									:message  			= "message"
									:messageClass 		= "messageClass"
									:previewUrl 		= "previewUrl"
									:epubUrl 			= "epubUrl"	
									:shortcodes  		= "shortcodes"							    
									@change-project 	= "setCurrentProject"
									@change-webproject 	= "setWebProject"
									@create-project 	= "createEbookProject"
									@delete-project 	= "deleteEbookProject"
									@save-project		= "storeEbookData"
									@reset-navigation 	= "resetNavigation"
									@generate-uuid 		= "setUuid"
								></component>
							</div>
						</form>
					</div>
				</Transition>`,
	data() {
		return {
			tabs: ["projects", "content", "pdf", "epub"],
			currentTab: "projects",
			currentTabComponent: "ebook-projects",

			navigation: {}, 
			layoutData: {}, /* holds all the different eBook layouts */
			formData: {}, /* holds the input data for the forms */
			formErrors: {},
			ebookprojects: ['ebookdata.yaml'],
			currentproject: false,
			webprojects: {},
			currentwebproject: false,
			shortcodes: false,
			message: '',
			messageClass: '',

			previewUrl: false,
			epubUrl: false,
		}
	},
	mounted() {

		eventBus.$on('forminput', formdata => {
			this.formData[formdata.name] = formdata.value;
		});

		/* set a default currentproject */
		this.currentproject = 'ebookdata.yaml';

		var self = this;

		/* get the ebook layouts */
		tmaxios.get('/api/v1/ebooklayouts',{
			params: {
				'url':	data.urlinfo.route,
			}
		})
		.then(function (response)
		{
			self.layoutData = response.data.layoutdata;

			/* use the first layout in folder as the default layout and store it in formData */
			var defaultlayout = Object.keys(self.layoutData)[0];
			self.formData = { 'layout': defaultlayout };
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

		/* get the ebook projects */
		tmaxios.get('/api/v1/ebookprojects',{
			params: {
				'url':	data.urlinfo.route,
			}
		})
		.then(function (response)
		{
			var webprojects = response.data.webprojects;
			if(Array.isArray(webprojects) && webprojects.length > 0)
			{
				self.webprojects = webprojects;
				self.setWebProject();
			}

			var ebookprojects = response.data.ebookprojects;
			if(Array.isArray(ebookprojects) && ebookprojects.length > 0)
			{
				/* activate and load the first project */
				self.ebookprojects = ebookprojects;
				self.currentproject = self.ebookprojects[0];
				self.loadEbookProject();
			}

			self.setPreviewUrls();
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
	},
	methods: {
		activateTab(tab)
		{
			this.currentTab = tab;
			this.currentTabComponent = 'ebook-' + tab;
			this.reset();
		},
		setPreviewUrls()
		{
			this.previewUrl = data.urlinfo.baseurl + '/tm/ebooks/preview?projectname=' + this.currentproject;
			this.epubUrl = data.urlinfo.baseurl + '/tm/ebooks/epub?projectname=' + this.currentproject;
		},
		setCurrentProject(projectname)
		{			
			this.currentproject = projectname;
			this.setPreviewUrls();
			this.reset();
			this.loadEbookProject();
		},
		setWebProject(webprojectid = false)
		{
		  	if (!this.webprojects || !this.webprojects.length)
		  	{
		    	return false;
		  	}

		  	if (!webprojectid)
		  	{
			    // Find project with base = true
			    const base = this.webprojects.find(p => p.base);
			    if(base)
			    {
			    	this.currentwebproject = base;
			    }
			}
			else
			{
			    // Find project with matching id
			    const selected = this.webprojects.find(p => p.id === webprojectid);
			    if (selected)
			    {
			    	this.currentwebproject = selected;
			    	this.resetNavigation();
			    }
		  	}
		},
		createEbookProject(projectname)
		{
			this.ebookprojects.push(projectname);
			this.currentproject = projectname;
			
			self = this; 

			/* get the last book data */
			tmaxios.post('/api/v1/ebookproject',{
				'url':	data.urlinfo.route,
				'projectname': projectname
			})
			.then(function (response)
			{
				self.reset();
				self.formData = {};
				self.navigation = {};

				/* use the first layout in folder as the default layout and store it in formData */
				var defaultlayout = Object.keys(self.layoutData)[0];
				self.formData = { 'layout': defaultlayout };
				self.setPreviewUrls();
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
		deleteEbookProject(ebookproject)
		{
			if(this.ebookprojects.indexOf(ebookproject) === -1)
			{
				this.message = 'This eBook-project does not exist.';
				return;
			}

			var self = this;

			tmaxios.delete('/api/v1/ebookproject',{
				data: {
					'url':	data.urlinfo.route,
					'projectname': 	ebookproject
				}
			})
			.then(function (response)
			{
				self.reset();

				for( var i = 0; i < self.ebookprojects.length; i++)
				{ 
					if ( self.ebookprojects[i] === ebookproject)
					{
						self.ebookprojects.splice(i, 1);
						if(ebookproject == self.currentproject)
						{
							self.currentproject = self.ebookprojects[0];
							self.setPreviewUrls();
							self.loadEbookProject();
						}
						break;
					}
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
		loadEbookProject()
		{
			self = this; 

			/* get the last book data */
			tmaxios.get('/api/v1/ebookdata',{
				params: {
					'url':	data.urlinfo.route,
					'projectname':  this.currentproject
				}
			})
			.then(function (response)
			{
				var ebookdata 		= response.data;

				if(ebookdata['formdata'])
				{
					self.formData = ebookdata['formdata'];
					if(self.formData.webproject)
					{
						self.setWebProject(self.formData.webproject);
					}
				}
				else
				{
					var defaultlayout 	= Object.keys(self.layoutData)[0];
					self.formData 		= { 'layout': defaultlayout };	        		
				}

				self.formData.activeshortcodes = Array.isArray(self.formData.activeshortcodes)
				    ? self.formData.activeshortcodes
				    : [];

				self.setPreviewUrls();

				self.loadEbookNavi(self.currentproject);
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
		loadEbookNavi()
		{
			self = this;

			tmaxios.get('/api/v1/ebooknavi',{
				params: {
					'url':	data.urlinfo.route,
					'projectname': 	this.currentproject, 
				}
			})
			.then(function (response){

				self.navigation = response.data.navigation;

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
		resetNavigation()
		{
			var self = this;

			/* always get the latest navigation (not the stored book navigation, because website navigation might have changed) */
			tmaxios.get('/api/v1/ebooknewdraftnavi',{
				params: {
					'url':	data.urlinfo.route,
					'webproject': this.currentwebproject?.id
				}
			})
			.then(function (response) {

				self.navigation = response.data.navigation;

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
		storeEbookData(css)
		{
			this.reset();

			var self = this;

			tmaxios.post('/api/v1/ebookdata',{
				'url':			data.urlinfo.route,
				'data': 		this.formData,
				'navigation': 	this.navigation,
				'projectname': 	this.currentproject
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
		reset()
		{
			this.errors 			= {};
			this.message 			= '';
			this.messageClass		= '';
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
		}
	},
})