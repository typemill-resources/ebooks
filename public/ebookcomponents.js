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
									<ul class="pa0 list text-sm">
										<li v-for="headline in headlines" :class="addLevelClass(headline.level)">
											<span class="text-teal-600">{{ headline.name }}</span> 
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
	components: {
		medialib: medialib
	},	
	props: ['errors', 'formdata', 'layouts', 'ebookprojects', 'currentproject', 'messageClass', 'message', 'previewUrl'],
	data: function(){
		return {
			src: data.urlinfo.baseurl + '/plugins/ebooks/booklayouts/',
			highlighted: '',
			accordionState: {},
			productionTab: 'pdf',
			termsAccepted: false,
			hasLicense: false,
			ebooks: [],
			generating: false,
			tokenstats: false,
			ebookmessage: false,
			showmedialib: false,
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
										<div v-if="showinfo(name)" class="table w-full">
											<span class="table-cell w-1/4 font-bold">{{ name }}:</span>
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
						<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8" v-if="fielddefinition.type == 'fieldset'" :class="{ 'open': isOpen(fieldname) }">
							<div @click="toggleAccordion(fieldname)" class="flex justify-between w-full py-2 text-lg font-medium cursor-pointer">
								<h3>{{ fielddefinition.legend }}</h3> 
								<span class="mt-2 h-0 w-0 border-x-8 border-x-transparent" :class="isOpen(fieldname) ? 'border-b-8 border-b-black' : 'border-t-8 border-t-black'"></span>
							</div>
							<transition name="accordion">
								<div v-if="isOpen(fieldname)" class="w-full accordion-content flex flex-wrap justify-between">						
									<component v-for="(subfield, subfieldname) in fielddefinition.fields"
										:key  		= "subfieldname"
										:is  		= "selectComponent(subfield.type)"
										:errors  	= "errors"
										:name 		= "subfieldname"
										:value 		= "formdata[subfieldname]" 
										v-bind 		= "subfield">
									</component>
								</div>
							</transition>
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

				<div class="mt-8 w-full inline-block">
					<ul class="flex flex-wrap mb-0">
						<li>
							<button 
								class="px-2 py-2 border-b-2 border-stone-200 dark:border-stone-900 hover:border-stone-700 hover:dark:border-stone-200 hover:bg-stone-200 hover:dark:bg-stone-900 transition duration-100"
								:class="(productionTab == 'pdf') ? 'border-stone-700 bg-stone-200 dark:bg-stone-900 dark:border-stone-200' : ''"
								@click.prevent="productionTab = 'pdf'"
								>Generate PDF
							</button>
						</li>
						<li>
							<button 
								class="px-2 py-2 border-b-2 border-stone-200 dark:border-stone-900 hover:border-stone-700 hover:dark:border-stone-200 hover:bg-stone-200 hover:dark:bg-stone-900 transition duration-100"
								:class="(productionTab == 'preview') ? 'border-stone-700 bg-stone-200 dark:bg-stone-900 dark:border-stone-200' : ''"
								@click.prevent="productionTab = 'preview'"
								>Preview PDF
							</button>
						</li>
					</ul>
					<div class="border-2 bg-stone-200 border-stone-300 dark:bg-stone-900 p-4 mb-8">
						<div v-if="productionTab == 'pdf'">
							<p class="my-2">
								Generate a PDF of your book remotely using the Kixote API.  
								The finished file will be saved directly into your medialibrary and shown in the list below.
							</p>
							<div v-if="!hasLicense" class="my-2"> 
								<p class="my-2">
									This service requires a Typemill <strong>MAKER</strong> or <strong>BUSINESS</strong> license. You can <a class="text-teal-500 underline" href="https://typemill.net/license/buy" target="blank">buy a license here</a>.
								</p>
								<p class="my-2">
									Alternatively, you can generate a pdf locally with the tab "Preview PDF".
								</p>
								<a 
									href="https://typemill.net/license/buy" 
									target="_blank" 
									class="mt-8 block w-full p-4 text-white bg-teal-500 border-2 border-stone-200 text-center hover:bg-teal-600 transition duration-100"
								>Buy a License</a>	
							</div>
							<div v-else>
								<p class="my-2">
									By clicking the button, your content will be temporarily processed by the Kixote server to generate the PDF. 
									No personal data will be stored on the server. 
									Only an anonymous identifier is kept to track usage and enforce rate limits.
									For more details, see our <a href="https://typemill.net/info/privacy#h3-kixote-services" target="_blank" class="underline text-teal-500">Privacy Policy</a>.
								</p>
								<button
								  v-if="generating"
								  disabled="disabled"
								  class="mt-8 flex items-center justify-center gap-2 w-full p-4 text-white bg-teal-500 border border-stone-300 text-center hover:bg-teal-600 transition duration-100 disabled:bg-stone-200 disabled:text-stone-900 disabled:dark:bg-stone-600 disabled:dark:text-stone-200 disabled:cursor-not-allowed"
								>
								  Generating PDF, do not leave this page
								  <svg class="ml-2 animate-spin h-5 w-5 text-stone-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								  </svg>
								</button>
								<button 
									v-else
									@click.prevent="kixotePdf()"
									class="mt-8 block w-full p-4 text-white bg-teal-500 border-1 border-stone-300 text-center hover:bg-teal-600 transition duration-100  disabled:bg-stone-200 disabled:text-stone-900 disabled:dark:bg-stone-600 disabled:dark:text-stone-200 disabled:cursor-not-allowed"
								>Generate PDF (10 Token)</button>
							</div>
							<div v-if="ebookmessage" class="text-center w-full bg-rose-500 text-white p-3 my-2">{{ ebookmessage }}</div>
							<div v-if="tokenstats" class="mt-6 bg-stone-100 border p-4">
							  <div class="flex text-center text-sm font-medium text-stone-700">
							    <div class="w-1/3">
							      <p>Monthly Tokens: 
								      <span class="font-semibold text-teal-600">{{ tokenstats.monthly_limit }}</span>
							      </p>
							    </div>
							    <div class="w-1/3">
									<p>Used: 
							      		<span class="font-semibold text-teal-600">{{ tokenstats.used_this_month }}</span>
							     	</p>
							    </div>
							    <div class="w-1/3">
									<p>Remaining: 
							      		<span class="font-semibold text-teal-600">{{ tokenstats.remaining_this_month }}</span>
							      	</p>
							    </div>
							  </div>
							</div>
							<div class="mt-5 space-y-3">
								<div v-if="ebooks.length > 0" class="my-2">
									<button 
										@click.prevent="showmedialib = true"
										class="w-full border border-stone-300 px-2 py-2 bg-stone-50 hover:bg-stone-100 dark:text-stone-200 dark:bg-stone-700 hover:dark:text-stone-900 transition duration-100"
										> open medialib 
										<svg class="icon icon-image"><use xlink:href="#icon-image"></use></svg>
									</button>
									<transition name="initial" appear>
										<div v-if="showmedialib" class="fixed top-0 left-0 right-0 bottom-0 bg-stone-100 dark:bg-stone-700 z-50">
											<button class="w-full bg-stone-200 dark:bg-stone-900 hover:dark:bg-rose-500 hover:bg-rose-500 hover:text-white p-2 transition duration-100" @click.prevent="showmedialib = false">{{ $filters.translate('close library') }}</button>
											<medialib parentcomponent="files"></medialib>
										</div>
									</transition>
								</div>
								<transition-group name="initial" tag="div" appear>
									<div 
									    v-for="ebook in ebooks" 
									    :key="ebook.name" 
									    class="flex items-center justify-between border bg-stone-100 p-4 mb-2"
									>
									    <!-- Left side: book icon + info -->
									    <div class="flex items-center">

									      <!-- Book icon -->
											<svg class="mr-2 h-6 w-6" viewBox="0 0 32 32">
											  <path d="M28 4v26h-21c-1.657 0-3-1.343-3-3s1.343-3 3-3h19v-24h-20c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h24v-28h-2z"></path>
											  <path d="M7.002 26v0c-0.001 0-0.001 0-0.002 0-0.552 0-1 0.448-1 1s0.448 1 1 1c0.001 0 0.001-0 0.002-0v0h18.997v-2h-18.997z"></path>
											</svg>

									      <!-- Ebook details -->
									      <div>
									        <div class="font-semibold text-stone-800">{{ ebook.ebookName }}</div>
									        <div class="text-sm text-stone-500">{{ ebook.ebookTime }}</div>
									      </div>

									    </div>

									    <!-- Right side: size + download -->
									    <div class="flex items-center space-x-4">

									      <div class="text-sm text-stone-600">
									        {{ (ebook.bytes / (1024 * 1024)).toFixed(2) }} MB
									      </div>

									      <a :href="getUrl(ebook.url)" download class="text-teal-600 hover:text-teal-800">
									        <!-- Download icon -->
									        <svg xmlns="http://www.w3.org/2000/svg" 
									             fill="none" 
									             viewBox="0 0 24 24" 
									             stroke-width="1.5" 
									             stroke="currentColor" 
									             class="w-6 h-6">
									          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-3-3m3 3l3-3M6 20h12" />
									        </svg>
									      </a>
										</div>
									</div>
								</transition>
							</div>
						</div>
						<div v-if="productionTab == 'preview'">
							<p class="my-2">
								The button below will open an HTML preview of your ebook in a new tab.  
								Please note that the preview may differ from the pdf generated with our API.
							</p>
							<p class="my-2">
								You can export the preview as a PDF using your browser’s built-in print function.  
								However, this method does not support features such as sidebar bookmarks and may produce layout issues (e.g., missing lines).  
								The preview works best in Chromium-based browsers (Google Chrome, Brave, Edge), and generally works well in Firefox too.
							</p>
							<p class="my-2">
								For best results, adjust the following print settings in your browser’s PDF printer:
							</p>
							<ul class="list-disc ml-4">
								<li>Set margins to <em>None</em></li>
								<li>Disable <em>Headers and Footers</em></li>
								<li>Enable <em>Background Graphics</em></li>
							</ul>
							<a 
								:href="previewUrl" 
								target="_blank" 
								class="mt-8 block w-full p-4 text-white bg-teal-500 border-2 border-stone-200 text-center hover:bg-teal-600 transition duration-100"
								@click="$emit('storeTmpItem')"
							>Open PDF-Preview</a>
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

		if(data.settings.license)
		{
			this.hasLicense = data.settings.license;
		}

		this.loadFiles();
	},
	methods: {
		getCover()
		{
			return this.src + this.formdata.layout + '/cover.png';
		},
		getUrl(relative)
		{
			return data.urlinfo.baseurl + '/' + relative;
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
		kixotePdf: function()
		{
			this.$emit('storeTmpItem');
			this.generating = true;

			var self = this;

			let projectname = false;
			let itempath = false;

		    let url = new URL(this.previewUrl);
		    if (url.searchParams.has("projectname"))
		    {
		        projectname = url.searchParams.get("projectname");
		    }
		    if (url.searchParams.has("itempath"))
		    {
		        itempath = url.searchParams.get("itempath");
		    }

			tmaxios.post('/api/v1/kixotepdf',{
				'url': data.urlinfo.route,
				'projectname': projectname,
				'itempath': itempath,
				'name': this.getName()
			})
		   .then(function (response)
			{
				self.tokenstats = JSON.parse(response.data.tokenstats);
				self.generating = false;
				self.loadFiles();
			})
			.catch(function (error)
			{
				self.generating = false;
				self.ebookmessage = error.response.data.errors.message;
			});
		},
		loadFiles()
		{
			var fileself = this;

			tmaxios.get('/api/v1/files',{
				params: {
					'url': data.urlinfo.route,
				}
			})
			.then(function (response)
			{
				const files = response.data.files;
				if(files && Array.isArray(files))
				{
					fileself.filterEbooks(files);
				}
			})
			.catch(function (error)
			{
				if(error.response)
				{
					let message = handleErrorMessage(error);
					if(message)
					{
						self.message = message;
						self.messagecolor = 'bg-tm-red';
					}
				}
			});
		},
		getName()
		{
		    let url = new URL(this.previewUrl);

		    if (url.searchParams.has("projectname"))
		    {
		        let project = url.searchParams.get("projectname");
		        return project.replace(/^ebookdata-/, "").replace(/\.yaml$/, "");
		    }

		    if (url.searchParams.has("itempath")) {
		        let itempath = url.searchParams.get("itempath");

		        // remove trailing "/index" if present
		        itempath = itempath.replace(/\/index$/, "");

		        let segments = itempath.split("/").filter(Boolean);
		        let last = segments.pop();

		        return last.replace(/^\d+-/, "");
		    }

		    return 'bookproject';
		},
		filterEbooks(files)
		{
		    const regex = /_(\d{8}-\d{4})$/; // matches _YYYYMMDD-HHMM at end of filename
		    const name = this.getName();

		    let results = files
		      .filter(file => 
		        file.info.extension === 'pdf' &&
		        file.info.filename.includes(name) &&
		        regex.test(file.info.filename)
		      )
		      .map(file => {
		        const match = file.info.filename.match(regex);
		        let readableTime = null;

		        if (match) {
		          const raw = match[1]; // e.g. 20250816-1957
		          const datePart = raw.substring(0, 8); // 20250816
		          const timePart = raw.substring(9, 13); // 1957

		          const year = datePart.substring(0, 4);
		          const month = datePart.substring(4, 6);
		          const day = datePart.substring(6, 8);
		          const hour = timePart.substring(0, 2);
		          const minute = timePart.substring(2, 4);

		          readableTime = `${year}-${month}-${day} ${hour}:${minute}`;
		        }

		        return {
		          ...file,
		          ebookName: file.info.filename.replace(regex, "").replace(/^ebookdata-/, ""), 
		          ebookTime: readableTime
		        };
		      });

		    // sort newest first by ebookTime
		    results.sort((a, b) => (a.ebookTime < b.ebookTime ? 1 : -1));

		    this.ebooks = results;
		},
		toggleAccordion: function(fieldname){
		    this.accordionState[fieldname] = !this.accordionState[fieldname];
		},
		isOpen: function(fieldname){
			return !!this.accordionState[fieldname];
		}		
	}
});


app.component("ebook-epub", {
	props: ['errors', 'formdata', 'layouts', 'messageClass', 'message', 'currentproject', 'epubUrl'],
	data: function(){
		return {
			booklayout: { 'customforms': false },
			accordionState: {},
		}
	},
	template: `<div>
				<form class="w-full my-8">
					<div v-if="booklayout.epubforms" v-for="(fielddefinition, fieldname) in booklayout.epubforms.fields">
						<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8" v-if="fielddefinition.type == 'fieldset'" :class="{ 'open': isOpen(fieldname) }">
							<div @click="toggleAccordion(fieldname)" class="flex justify-between w-full py-2 text-lg font-medium cursor-pointer">
								<h3>{{ fielddefinition.legend }}</h3> 
								<span class="mt-2 h-0 w-0 border-x-8 border-x-transparent" :class="isOpen(fieldname) ? 'border-b-8 border-b-black' : 'border-t-8 border-t-black'"></span>
							</div>
							<transition name="accordion">
								<div v-if="isOpen(fieldname)" class="w-full accordion-content flex flex-wrap justify-between">						
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
								</div>
							</transition>
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
		},
		toggleAccordion: function(fieldname){
		    this.accordionState[fieldname] = !this.accordionState[fieldname];
		},
		isOpen: function(fieldname){
			return !!this.accordionState[fieldname];
		}		
	}
});