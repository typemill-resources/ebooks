app.component("ebook-projects", {
	props: ['errors', 'formdata', 'layouts', 'ebookprojects', 'currentproject'],
	data: function(){
		return {
			projectname: '',
			projectnameerror: false,
			disabled: 'disabled',
		}
	},
	template: `<div class="ebookcover">
				<form class="w-full">
					<fieldset v-if="ebookprojects" class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8">
						<legend class="text-lg font-medium">Select a Project</legend>
						<div class="py-3 w-full">
							<div v-for="ebookproject in ebookprojects" class="w-full relative my-1 p-2 border border-stone-300">
								<label class="inline-flex items-start">
									<input 
										@change 	= "$emit('changeProject', ebookproject)" 
										type 		= "radio" 
										name 		= "project" 
										:checked 	= "ebookproject == currentproject" 
										class 		= "w-6 h-6 border-stone-300 bg-stone-200" />
									<span class="ml-2 text-sm">{{ readableProject(ebookproject) }}</span>
								</label>
								<button 
									@click.prevent="$emit('deleteProject', ebookproject)" 
									class="absolute right-0 top-0 px-2 py-1 mt-2 mr-2 bg-stone-200 hover:bg-rose-500 text-stone-900 hover:text-stone-100 inline-block text-center"
								>x</button>
							</div>
						</div>
						<div class="w-full">
							<label for="ebookprojectname" class="block mb-1 font-medium">Insert a name for your new ebook-project</label>
							<div class="flex">
								<input 
									id 			= "ebookprojectname" 
									name 		= "ebookprojectname" 
									v-model 	= "projectname" 
									@input 		= "checkProjectName()" 
									type 		= "text" 
									maxlength 	= "20"
									class 		= "h-12 w-3/4 border px-2 py-3 border-stone-300 bg-stone-200 text-stone-900" 
								/>
								<button 
									class 			= "w-1/4 px-2 py-3 ml-2 text-stone-50 bg-stone-700 hover:bg-stone-900 hover:text-white transition duration-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-800" 
									@click.prevent 	= "createProject()" 
									:disabled 		= "disabled"
								>Create project</button>
							</div>
							<div class="w-full">
								<span v-if="projectnameerror" class="text-rose-500">{{ projectnameerror }}</span>
								<span v-else>Between 3 and 20 characters allowed.</span>
							</div>
						</div>
					</fieldset>
				</form>
			  </div>`,
	methods: {
		readableProject(ebookproject)
		{
			if(ebookproject == 'ebookdata.yaml')
			{
				return 'default project';
			}
			var readablename = ebookproject.replace(".yaml", "");
			return readablename.replace("ebookdata-", ""); 
		},
		createProject: function()
		{
			this.$emit('createProject', 'ebookdata-' + this.projectname + '.yaml');
			this.projectname = '';
		},
		checkProjectName: function()
		{
			this.projectnameerror = false;
			this.disabled = 'disabled';

			if(this.projectname.length == 0)
			{
				return;
			}
			else if(this.projectname.length < 3 || this.projectname.length > 20)
			{
				this.projectnameerror = "Must be between 3 - 20 characters.";
			}
			else if(this.ebookprojects.indexOf('ebookdata-' + this.projectname + '.yaml') !== -1)
			{
				this.projectnameerror = "This projectname already exists";				
			}
			else if(/^[a-z\-]*$/gm.test(this.projectname))
			{
				this.disabled = false;
			}
			else
			{
				this.projectnameerror = 'Only characters a-z and - allowed.'
			}
		},
		deleteProject: function(ebookproject)
		{
			this.$emit('deleteEbookProject', ebookproject);
		},
	}
});


app.component("ebook-content", {
	props: ['navigation', 'errors', 'shortcodes', 'formdata', 'layouts', 'messageClass', 'message'],
	data: function(){
		return {
			booklayout: { 'customforms': false },
			headlines: false,
			shortcodeOpen: false,
		}
	},	
	template: `<div>
				<form class="w-full my-8">
				<div class="flex flex-wrap justify-between">
					<fieldset v-if="shortcodes" class="block w-full border-2 border-stone-200 p-4 my-8">
						<div @click="shortcodeOpen = !shortcodeOpen" class="flex justify-between w-full py-2 text-lg font-medium cursor-pointer">
							<h3>Configure Shortcodes</h3> 
							<span class="mt-2 h-0 w-0 border-x-8 border-x-transparent" :class="shortcodeOpen ? 'border-b-8 border-b-black' : 'border-t-8 border-t-black'"></span>
						</div>
						<transition name="accordion">
					        <div v-if="shortcodeOpen" class="w-full accordion-content flex flex-wrap justify-between">
								<div class="mt-2">
									<div class="block mb-1 font-medium">Disable shortcodes</div>
									<label class="inline-flex items-start">
										<input 
											type 	= "checkbox" 
											name 	= "shortcodes" 
											v-model = "formdata.disableshortcodes" 
											class 	= "w-6 h-6 border-stone-300 bg-stone-200" 
										/>
										<span class="ml-2 text-sm">Disable and exclude all shortcodes for the eBook.</span>
									</label>
								</div>
								<div class="w-full mt-2">
									<div class="block mb-1 font-medium">Activate shortcodes individually</div>
									<div 
										v-for 	= "(shortcodedata,shortcodename) in shortcodes" 
										:key 	= "shortcodename" 
										class 	= "w-full"
										>
										<label class="inline-flex items-start">
											<input 
												type 	= "checkbox" 
												v-model = "formdata.activeshortcodes" 
												:id 	= "shortcodename" 
												:value 	= "shortcodename"
												class 	= "w-6 h-6 border-stone-300 bg-stone-200" 
											/>
											<span class="ml-2 text-sm">{{shortcodename}}</span>
										</label>
									</div>
								</div>	
							</div>
						</transition>
					</fieldset>
					<fieldset class="lg:w-half border-2 border-stone-200 p-4">
						<legend class="text-lg font-medium">Select pages from your website</legend>
						<div>
							<button 
								@click.prevent = "$emit('resetNavigation')" 
								class = "p-3 my-1 bg-stone-700 hover:bg-stone-900 text-white cursor-pointer transition duration-100"
							>reset/refresh navigation</button>
							<div class="pl-6 mt-5" v-if="basefolder()">
								<label class="block mb-1 font-medium">
									<input 
										type 	= "checkbox" 
										name 	= "excludebasefolder" 
										@change = "$emit('toggleBasefolder')" 
										v-model = "formdata.excludebasefolder" 
									/>
									<span class="ml-2 text-sm">Exclude the base folder from eBook</span>
								</label>
								<hr>
							</div>
							<div class="py-3">
								<list :navigation="navigation"></list>
							</div>
						</div>
					</fieldset>
					<fieldset class="lg:w-half border-2 border-stone-200 p-4">
						<legend class="text-lg font-medium">Headlines</legend>
						<div class="w-full" :class="{ error : errors.downgradeheadlines }">
							<p>You can downgrade the headline-levels of sub-pages to modify the hierarchy in your book.</p>
							<div class="py-3">
								<label class="block mb-1 font-medium">
									<input 
										type 	= "radio" 
										id 		= "none" 
										value 	= "0" 
										v-model = "formdata.downgradeheadlines" 
										@change = "headlinepreview()"
									/>
									<span class="ml-2 text-sm">Do not downgrade headlines.</span>
								</label>
								<label class="block mb-1 font-medium">
									<input 
										type 	= "radio" 
										id 		= "first" 
										value 	= "1" 
										v-model = "formdata.downgradeheadlines" 
										@change = "headlinepreview()"
									/>
									<span class="ml-2 text-sm">Downgrade starting from first subpage-level.</span>
								</label>
								<label class="block mb-1 font-medium">
									<input 
										type 	= "radio" 
										id 		= "second" 
										value 	= "2" 
										v-model = "formdata.downgradeheadlines" 
										@change = "headlinepreview()"
									/>
									<span class="ml-2 text-sm">Downgrade starting from second subpage-level.</span>
								</label>
								<label class="block mb-1 font-medium">
									<input 
										type 	= "radio" 
										id 		= "third" 
										value 	= "3" 
										v-model	="formdata.downgradeheadlines" 
										@change = "headlinepreview()"
									/>
									<span class="ml-2 text-sm">Downgrade starting from third subpage-level.</span>
								</label>
							</div>
						</div> 
						<hr class="my-3">
						<div class="w-full">
							<h3 class="text-lg font-medium pt-3">Table of Contents</h3>
							<div class="my-3 p-3 bg-stone-200">
								<div v-if="headlines">
									<ul class="pa0 list">
										<li v-for="headline in headlines">
											<span class="text-teal-600" :class="addLevelClass(headline.level)">{{ headline.name }}</span> 
											{{ headline.text }}
										</li>
									</ul>
								</div>
								<div v-else>Select pages on the left to generate a Table of Contents.</div>
							</div>
						</div> 
					</fieldset>
					</div>
					<div class="my-5">
						<div :class="messageClass" class="block w-full h-8 px-3 py-1 my-1 text-white transition duration-100">{{ $filters.translate(message) }}</div>
						<input 
							type 			= "submit" 
							@click.prevent 	= "$emit('saveProject')" 
							:value 			= "$filters.translate('save')" 
							class 			= "w-full p-3 my-1 bg-stone-700 hover:bg-stone-900 text-white cursor-pointer transition duration-100"
						>
					</div>
				</form>
			</div>`,
	mounted: function(){
		
		this.booklayout = this.layouts[this.formdata.layout];

		if(this.formdata.excludebasefolder)
		{
		//	this.$parent.excludeBaseFolder(this.formdata.excludebasefolder);			
		}

		eventBus.$on('createHeadlinePreview', this.headlinepreview );

		this.headlinepreview();
	},
	methods: {
		addLevelClass(level)
		{
			return 'pl-' + (level*2);
		},
		basefolder()
		{
			if(this.navigation.length == 1 && this.navigation[0].folderContent)
			{
				return true;
			}
		},
		headlinepreview()
		{
			var self = this;

			tmaxios.post('/api/v1/headlinepreview',{
				'url':			data.urlinfo.route,
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


app.component("list", {
	props: ['navigation'],
	data: function(){
		return {
			folder: 'folder'
		}
	},
	template: `<ul class="pl-6">
				<li v-for="item in publishedItems">
					<label class="block mb-1 font-medium">
						<input 
							type 		= "checkbox" 
							:id 		= "item.keyPath"
							:name 		= "item.name"
							:disabled 	= "checkDisabled(item)"				    
							v-model 	= "item.include"
							@change 	= "loadpreview"
						/>
						<span class="ml-2 text-sm">{{item.name}}</span>
					</label>
					<div v-if="item.elementType == folder">
						<list :navigation="item.folderContent"></list>
					</div>
				</li>

			  </ul>`,
	computed: {
		publishedItems: function () 
		{
			if(this.navigation.filter !== undefined)
			{
				return this.navigation.filter(function (item)
				{
					return item.status == "published";
				})
			}
		}
	},
	methods: {
		loadpreview()
		{
			eventBus.$emit('createHeadlinePreview');
		},
		checkDisabled(item)
		{
			if(item.disabled)
			{
				return "disabled";
			}
			return false;
		}
	},
});


app.component("ebook-pdf", {
	props: ['errors', 'formdata', 'layouts', 'ebookprojects', 'currentproject', 'messageClass', 'message', 'previewUrl'],
	data: function(){
		return {
			src: data.urlinfo.baseurl + '/plugins/ebooks/booklayouts/',
			highlighted: '',
//			previewUrl: data.urlinfo.baseurl + '/tm/ebooks/preview?projectname=' + this.currentproject,
		}
	},
	template: `<div>
				<form class="w-full">
					<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8">
						<legend class="text-lg font-medium">Select a Layout</legend>
						<div class="lg:w-half">
							<img class="coverpreview" :src="getCover()">
						</div>
						<div class="lg:w-half" :class="{ error : errors.design}">
							<label class="block mb-1 font-medium">Select a book layout</label>
							<div v-for="details,layout in layouts">
								<label class="block mb-1 font-medium">
									<input 
										type 	 	= "radio" 
										name 	 	= "design" 
										v-model  	= "formdata.layout" 
										:value 		= "layout" 
										class  		= "w-6 h-6 border-stone-300 bg-stone-200" 
										@change 	= "updateCode"
									/>
									<span class="ml-2 text-sm">{{ layout }}</span>
								</label>
							</div>
							<div class="block pt-3 mb-1 font-medium">About this layout</div>
							<div class="text-sm"> 
								<ul>
									<li v-for="info,name in layouts[formdata.layout]">
										<div v-if="showinfo(name)" class="table">
											<span class="table-cell w-24 font-bold">{{ name }}:</span>
											<a v-if="name == 'Link'" :href="info">{{ info }}</a>
											<span v-else>{{ info }}</span>
										</div>
									</li>
								</ul>
							</div>
							<span class="text-rose-500" v-if="errors.layout">{{ errors.layout[0] }}</span>
						</div>
					</fieldset>
					<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8">
						<legend class="text-lg font-medium">Custom CSS for {{ layouts[formdata.layout].name }}</legend>						
						<div class="w-full">
							<label>Customize the layout with CSS</label>
							<div class="codearea"> 
								<textarea 
									data-el 	= "editor" 
									class 		= "editor" 
									ref 		= "editor" 
									v-model 	= "layouts[formdata.layout].customcss"
									@input 		= "updateCode"
								></textarea>
								<pre aria-hidden="true" class="highlight hljs"><code data-el="highlight" v-html="highlighted"></code></pre>
							</div>
						</div>
					</fieldset>
					<div v-if="layouts[formdata.layout].customforms" v-for="(fielddefinition, fieldname) in layouts[formdata.layout].customforms.fields">
						<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8" v-if="fielddefinition.type == 'fieldset'">
							<legend class="text-lg font-medium">{{ fielddefinition.legend }}</legend>
							<component v-for="(subfield, subfieldname) in fielddefinition.fields"
								:key  		= "subfieldname"
								:is  		= "selectComponent(subfield.type)"
								:errors  	= "errors"
								:name 		= "subfieldname"
								:value 		= "formdata[subfieldname]" 
								v-bind 		= "subfield">
							</component>
						</fieldset>
						<component v-else
							:key  			= "fieldname"
							:is  			= "selectComponent(fielddefinition.type)"
							:errors  		= "errors"
							:name  			= "fieldname"
							:value  		= "formdata[fieldname]"
							v-bind  		= "fielddefinition">
						</component>
					</div>
					<div class="my-5">
						<div :class="messageClass" class="block w-full h-8 px-3 py-1 my-1 text-white transition duration-100">{{ $filters.translate(message) }}</div>
						<input 
							type 			= "submit" 
							@click.prevent 	= "$emit('saveProject', 'css')" 
							:value 			= "$filters.translate('save')" 
							class 			= "w-full p-3 my-1 bg-stone-700 hover:bg-stone-900 text-white cursor-pointer transition duration-100"
						>
					</div>
				</form>

				<div class="border-2 border-stone-200 p-4 my-8 bg-stone-100">
					<h2 class="text-2xl font-bold mb-4 mt-2">Produce a PDF</h2>
					<p class="my-2">Here you can generate a html-preview for your eBook in PDF format or directly create a pdf-file.</p>
					<div class="flex my-8 justify-between">
						<div class="lg:w-half">
							<a 
								:href="previewUrl" 
								target="_blank" 
								class="block w-full p-4 text-white bg-teal-500 border-2 border-stone-200 text-center hover:bg-teal-600 transition duration-100"
								@click="$emit('storeTmpItem')"
							>Open PDF-Preview</a>
							<p class="my-2">This button will open a html-preview of the ebook in a separate page. You can download and save the ebook as pdf with your local printer driver.</p>
							<p class="my-2">It works with chromium-browser like Google Chrome or Brave.</p>
							<p class="my-2">Check the following extended settings in your PDF printer configurations:</p>
							<ul class="list-disc ml-4">
								<li>Set margins to “none”</li>
								<li>Uncheck “Headers and footers” or set them to none</li>
								<li>Check “Background graphics”</li>
							</ul>
						</div>
						<div class="lg:w-half">
							<button 
								disabled="disabled"
								class="w-full p-4 text-white bg-teal-500 border-2 border-stone-200 text-center"
							>Generate PDF with API (comming soon)</button>
							<p class="my-2">This button will use the typemill service-api and directly return an eBook in PDF format (comming soon). A Typemill license will be required to use the service.</p>
						</div>
					</div>
				</div>
			  </div>`,
	mounted: function(){
		this.resizeCodearea();
		this.highlight(this.layouts[this.formdata.layout].customcss);

		this.$nextTick(() => {
			this.autosize();
		});
	},
	methods: {
		getCover()
		{
			return this.src + this.formdata.layout + '/cover.png';
		},
		showinfo(name)
		{
			if(name != 'customforms' && name != 'customcss' && name != 'epubforms')
			{
				return true;
			}
		},
		selectComponent(type)
		{
			return 'component-'+type;
		},
		autosize()
		{
//			autosize(document.querySelector('textarea'));
		},
		updateCode()
		{
			this.highlighted = '';
			this.resizeCodearea();
			this.highlight(this.layouts[this.formdata.layout].customcss);
		},
		resizeCodearea: function()
		{
			let codeeditor = this.$refs["editor"];

			window.requestAnimationFrame(() => {
				codeeditor.style.height = '200px';
				if (codeeditor.scrollHeight > 200)
				{
					codeeditor.style.height = `${codeeditor.scrollHeight + 2}px`;
				}
			});
		},
		highlight: function(code)
		{
			if(code === undefined)
			{
				return;
			}

			window.requestAnimationFrame(() => {
				highlighted = hljs.highlightAuto(code, ['xml','css','yaml','markdown']).value;
				this.highlighted = highlighted;
			});
		},		
	}
});


app.component("ebook-epub", {
	props: ['errors', 'formdata', 'layouts', 'messageClass', 'message', 'currentproject', 'epubUrl'],
	data: function(){
		return {
			booklayout: { 'customforms': false }
		}
	},
	template: `<div>
				<form class="w-full my-8">
					<div v-if="booklayout.epubforms" v-for="(fielddefinition, fieldname) in booklayout.epubforms.fields">
						<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8" v-if="fielddefinition.type == 'fieldset'">
							<legend class="text-lg font-medium">{{ fielddefinition.legend }}</legend>
							<div v-if="fieldname == 'epubidentifier'" class="w-full mt-5 mb-5">Please add one identifier: either an ISBN, UUID or URI. If you add more than one identifiers, then the first will be used and the others will be ignored. Identifiers must be unique. Never change an identifier after you published/distributed a book, otherwise e-readers cannot identify the book anymore.</div>
							<component v-for="(subfield, subfieldname) in fielddefinition.fields"
								:key="subfieldname"
								:is="selectComponent(subfield.type)"
								:errors="errors"
								:name="subfieldname"
								:value="formdata[subfieldname]" 
								v-bind="subfield">
								<slot v-if="subfieldname == 'epubidentifieruuid'">
									<button 
										class   		= "absolute px-2 py-3 ml-2 text-stone-50 bg-stone-700 hover:bg-stone-900 hover:text-white transition duration-100 cursor-pointer" 
										style 			= "right:0px; width:200px;"
										@click.prevent 	= "$emit('generateUuid')" 
									>Generate UUID</button>
								</slot>
							</component>
						</fieldset>
						<component v-else
							:key="fieldname"
							:is="selectComponent(fielddefinition.type)"
							:errors="errors"
							:name="fieldname"
							:value="formdata[fieldname]"
							v-bind="fielddefinition">
						</component>
					</div>
					<div class="my-5">
						<div :class="messageClass" class="block w-full h-8 px-3 py-1 my-1 text-white transition duration-100">{{ $filters.translate(message) }}</div>
						<input 
							type 			= "submit" 
							@click.prevent 	= "$emit('saveProject')" 
							:value 			= "$filters.translate('Save Settings')" 
							class 			= "w-full p-3 my-1 bg-stone-700 hover:bg-stone-900 text-white cursor-pointer transition duration-100"
						>
					</div>
				</form>

				<div class="border-2 border-stone-200 p-4 my-8 bg-stone-100">
					<h2 class="text-2xl font-bold mb-4 mt-2">Produce an ePub</h2>
					<p class="my-2">Here you can generate an eBook in ePub format. The ePub will support most of the common ePub-3 specifications, but some features might be missing.</p>
					<div class="flex my-8 justify-between">
						<div class="lg:w-half">
							<a 
								:href="epubUrl" 
								target="_blank" 
								class="block w-full p-4 text-white bg-teal-500 border-2 border-stone-200 text-center hover:bg-teal-600 transition duration-100"
								@click="$emit('storeTmpItem')"
							>Generate ePub locally</a>
							<p class="my-2">This button will generate the ePub-file locally and open the browser dialogue to download the file.</p>
						</div>
						<div class="lg:w-half">
							<button disabled="disabled"
								class="w-full p-4 text-white bg-teal-500 border-2 border-stone-200 text-center"
							>Generate ePub with API (comming soon)</button>
							<p class="my-2">This button will use the typemill service-api (comming soon). It will support mathematical syntax in your ePub. A Typemill license will be required to use the service.</p>
						</div>
					</div>
				</div>

			  </div>`,
	mounted: function(){

		this.booklayout = this.layouts[this.formdata.layout];
	
	},		
	methods: {
		selectComponent(type)
		{
			return 'component-'+type;
		},
		validate(field)
		{
			/* use the html5 field validation for error messages */
			this.errors[field.name] = false;
			if(field.validationMessage != '')
			{
				this.errors[field.name] = [field.validationMessage];
			}
		},
		autosize()
		{
			autosize(document.querySelector('textarea'));
		}
	}
});