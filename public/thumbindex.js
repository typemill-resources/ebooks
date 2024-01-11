app.component('tab-thumbindex', {
	props: ['item', 'formData', 'formDefinitions', 'saved', 'errors', 'message', 'messageClass'],
	template: `<section class="dark:bg-stone-700 dark:text-stone-200">
					<form>
						<div v-for="(fieldDefinition, fieldname) in formDefinitions.fields">
							<fieldset class="flex flex-wrap justify-between border-2 border-stone-200 p-4 my-8" v-if="fieldDefinition.type == 'fieldset'">
								<legend class="text-lg font-medium">{{ fieldDefinition.legend }}</legend>
								<component v-for="(subfieldDefinition, subfieldname) in fieldDefinition.fields"
									:key="subfieldname"
									:is="selectComponent(subfieldDefinition.type)"
									:errors="errors"
									:name="subfieldname"
									:userroles="userroles"
									:value="formData[subfieldname]" 
									v-bind="subfieldDefinition">
								</component>
							</fieldset>
							<component v-else
								:key="fieldname"
								:is="selectComponent(fieldDefinition.type)"
								:errors="errors"
								:name="fieldname"
								:userroles="userroles"
								:value="formData[fieldname]" 
								v-bind="fieldDefinition">
							</component>
						</div>
						<div class="my-5 w-full">
							<div :class="messageClass" class="block w-full h-8 px-3 py-1 my-1 text-white transition duration-100">{{ $filters.translate(message) }}</div>
							<input type="submit" @click.prevent="saveInput()" :value="$filters.translate('save')" class="w-full p-3 my-1 bg-stone-700 dark:bg-stone-600 hover:bg-stone-900 hover:dark:bg-stone-900 text-white cursor-pointer transition duration-100">
						</div>						
					</form>
				</section>`,
	mounted: function(){
		eventBus.$on('forminput', formdata => {

			var thumb = this.formDefinitions.fields.thumbfields.fields.language.options[formdata.value];
			if(formdata.name == "language")
			{
				if(!thumb)
				{
					eventBus.$emit('forminput', {'name': 'lang', 'value' : '' });
					eventBus.$emit('forminput', {'name': 'thumb', 'value' : '' });					
				}
				else
				{
					eventBus.$emit('forminput', {'name': 'lang', 'value' : formdata.value });
					eventBus.$emit('forminput', {'name': 'thumb', 'value' : thumb.toUpperCase() });
				}
			}
		});
	},
	methods: {
		selectComponent: function(type)
		{ 
			return 'component-' + type;
		},
		saveInput: function()
		{
			this.$emit('saveform');
		},
	}
})
