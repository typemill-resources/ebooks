Vue.component('tab-thumbindex', {
	props: ['saved', 'errors', 'formdata', 'schema'],
	template: '<section><form>' +
				'<component v-for="(field, index) in schema.fields"' +
            	    ':key="index"' +
                	':is="selectComponent(field)"' +
                	':errors="errors"' +
                	':name="index"' +
                	'v-model="formdata[index]"' +
                	'v-bind="field">' +
				'</component>' + 
				'<div v-if="saved" class="metaLarge"><div class="metaSuccess">Saved successfully</div></div>' +
				'<div v-if="errors" class="metaLarge"><div class="metaErrors">Please correct the errors above</div></div>' +
				'<div class="large"><input type="submit" @click.prevent="saveInput" value="save"></input></div>' +
			  '</form></section>',
	mounted: function(){
		FormBus.$on('forminput', formdata => {

			var thumb = this.schema.fields.language.options[formdata.value];
			if(formdata.name == "language")
			{
				if(formdata.value == 'clear')
				{
					FormBus.$emit('forminput', {'name': 'lang', 'value' : '' });
					FormBus.$emit('forminput', {'name': 'thumb', 'value' : '' });					
				}
				else
				{
					FormBus.$emit('forminput', {'name': 'lang', 'value' : formdata.value });
					FormBus.$emit('forminput', {'name': 'thumb', 'value' : thumb.toUpperCase() });
				}
			}

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
		}
	}
})
