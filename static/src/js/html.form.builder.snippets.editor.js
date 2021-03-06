odoo.define('html_form_builder_snippets.editor', function (require) {
'use strict';

var base = require('web_editor.base');
var options = require('web_editor.snippets.options');
var core = require('web.core');
var session = require('web.session');
var website = require('website.website');
var return_string = ""; //Global because I can't change html in session.rpc function
var ajax = require('web.ajax');
var qweb = core.qweb;
var wUtils = require('website.utils');
var rpc = require('web.rpc');
var weContext = require('web_editor.context');

ajax.loadXML('/ips_html_form_builder/static/src/xml/html_form_modal30.xml', qweb);

options.registry.html_form_builder = options.Class.extend({
    onBuilt: function() {
        var self = this;


        rpc.query({
                model: 'html.form',
                method: 'name_search',
                args: [],
                context: weContext.get()
            }).then(function(form_ids){

	            wUtils.prompt({
			        id: "editor_new_form",
			        window_title: "Existing HTML Form",
			        select: "Select Form",
			        init: function (field) {
			            return form_ids;
			        },
			    }).then(function (form_id) {

			        session.rpc('/form/load', {'form_id': form_id}).then(function(result) {
			    	    self.$target.html(result.html_string);
			    	    self.$target.attr('data-form-model', result.form_model );
			    	    self.$target.attr('data-form-id', form_id );
                 	});
			    });

            });

    },
    cleanForSave: function () {
		//Sometimes gets saved with the token in it
        $(".html_form input[name='csrf_token']").val("");
    },

});

options.registry.html_form_builder_new = options.Class.extend({
    onBuilt: function() {
        var self = this;

        rpc.query({
		    model: 'html.form.snippet.action',
		    method: 'name_search',
		    args: [],
		    context: weContext.get()
		}).then(function(action_ids){

	        wUtils.prompt({
			    id: "editor_new_form_new",
			    window_title: "New HTML Form",
			    select: "Select Action",
			    init: function (field) {
			        return action_ids;
			    },
			}).then(function (action_id) {

			    session.rpc('/form/new', {'action_id': action_id}).then(function(result) {
				    self.$target.html(result.html_string);
				    self.$target.attr('data-form-model', result.form_model );
				    self.$target.attr('data-form-id', result.form_id );
				    //Behaves like a regular form after creation
				    self.$target.attr('class', 'html_form' );
             	});
			});

        });
    },

});

// ------------------------ TEXTBOX CONFIG ----------------------
options.registry.html_form_builder_field_textbox = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.textbox_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlTextboxModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['char','integer','float'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlTextboxModal').modal('show');

        $('body').on('click', '#save_textbox_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
	            var format_validation = self.$modal.find('#html_form_field_format_validation').val();
                var character_limit = self.$modal.find('#html_form_field_character_limit').val();
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'format_validation': format_validation, 'character_limit': character_limit, 'field_required': field_required }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlTextboxModal').modal('hide');

		    }

        });

    },
});

// ------------------------ TEXTAREA CONFIG ----------------------
options.registry.html_form_builder_field_textarea = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.textarea_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlTextareaModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['char','text'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlTextareaModal').modal('show');

        $('body').on('click', '#save_textarea_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'field_required': field_required }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlTextareaModal').modal('hide');

		    }

        });

    },
});

// ------------------------ CHECKBOX GROUP CONFIG ----------------------
options.registry.html_form_builder_field_checkbox_group = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.checkbox_group_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlCheckboxGroupModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['many2many'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlCheckboxGroupModal').modal('show');

        $('body').on('click', '#save_checkbox_group_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_size = self.$modal.find('#field_size').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type') }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlCheckboxGroupModal').modal('hide');

		    }

        });

    },
});

// ------------------------ DROPBOX CONFIG ----------------------
options.registry.html_form_builder_field_dropbox = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.dropbox_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlDropboxModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['selection','many2one'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlDropboxModal').modal('show');

        $('body').on('click', '#save_dropbox_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'field_required': field_required }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlDropboxModal').modal('hide');

		    }

        });

    },
});

// ------------------------ RADIO GROUP CONFIG ----------------------
options.registry.html_form_builder_field_radio_group = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.radio_group_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlRadioGroupModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['selection'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlRadioGroupModal').modal('show');

        $('body').on('click', '#save_radio_group_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();
                var layout_type = self.$modal.find('#layout_type').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'field_required': field_required, 'layout_type': layout_type }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlRadioGroupModal').modal('hide');

		    }

        });

    },
});

// ------------------------ DATE PICKER CONFIG ----------------------
options.registry.html_form_builder_field_date_picker = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.date_picker_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlDatePickerModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['date'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlDatePickerModal').modal('show');

        $('body').on('click', '#save_date_picker_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();
                var date_format = self.$modal.find('#date_format').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'field_required': field_required, 'setting_date_format':date_format }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlDatePickerModal').modal('hide');

		    }

        });

    },
});

// ------------------------ DATETIME PICKER CONFIG ----------------------
options.registry.html_form_builder_field_datetime_picker = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.datetime_picker_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlDateTimePickerModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['datetime'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlDateTimePickerModal').modal('show');

        $('body').on('click', '#save_datetime_picker_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'field_required': field_required}).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlDateTimePickerModal').modal('hide');

		    }

        });

    },
});

// ------------------------ CHECKBOX CONFIG ----------------------
options.registry.html_form_builder_field_checkbox = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.checkbox_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlCheckboxModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['boolean'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlCheckboxModal').modal('show');

        $('body').on('click', '#save_checkbox_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {
                var field_required = self.$modal.find('#html_form_field_required').is(':checked');
                var field_size = self.$modal.find('#field_size').val();

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'field_required': field_required}).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlCheckboxModal').modal('hide');

		    }

        });

    },
});

// ------------------------ BINARY CONFIG ----------------------
options.registry.html_form_builder_field_binary = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.binary_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlBinaryModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['binary'];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        //Count the amount of bootstrap columns in the row
        var current_columns = 0;
        if (self.$target.parent().attr("id") == "html_field_placeholder") {
            self.$target.parent().parent().find(".hff").each(function( index ) {
	    	    if ($( this ).hasClass("col-md-12")) { current_columns = 12;}
	    		if ($( this ).hasClass("col-md-11")) { current_columns = 11;}
	    		if ($( this ).hasClass("col-md-10")) { current_columns = 10;}
	    		if ($( this ).hasClass("col-md-9")) { current_columns = 9;}
	    		if ($( this ).hasClass("col-md-8")) { current_columns = 8;}
	    		if ($( this ).hasClass("col-md-7")) { current_columns = 7;}
	    		if ($( this ).hasClass("col-md-6")) { current_columns = 6;}
	    		if ($( this ).hasClass("col-md-5")) { current_columns = 5;}
	    		if ($( this ).hasClass("col-md-4")) { current_columns = 4;}
	    		if ($( this ).hasClass("col-md-3")) { current_columns = 3;}
	    		if ($( this ).hasClass("col-md-2")) { current_columns = 2;}
	    		if ($( this ).hasClass("col-md-1")) { current_columns = 1;}
            });
	    }

        //Only show sizes that that are less then or equal to the remiaining columns
        var field_size_html = "";
        var i = 0;
        for (i = (12 - current_columns); i > 0; i--) {
			var number = (i / 12 * 100);
            field_size_html += "<option value=\"" + i + "\">" + Math.round( number * 10 ) / 10 + "%</option>\n"
		}

        self.$modal.find('#field_size').html(field_size_html);

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlBinaryModal').modal('show');

        $('body').on('click', '#save_binary_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            var field_size = 12;
            if (field_id != "") {

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type') }).then(function(result) {
		    	    if (field_size == "12") {
		    	        self.$target.replaceWith(result.html_string);
				    } else {
						var header_wrapper = "";
						var footer_wrapper = "";

					    //Create a row if you are the first element in a "row" of fields
						if (self.$target.parent().attr("id") == "html_fields") {
						    header_wrapper = "<div class=\"row\">\n";
						    footer_wrapper = "</div>";
						}

						//Remove the placeholder div to keep the HTML clean
                        if (self.$target.parent().attr("id") == "html_field_placeholder") {
	  	    	            self.$target.unwrap();
						}

                        //Add the current field size otherwise the reminaing wwhile be off
                        current_columns += field_size;

                        var remaining_columns = 12 - current_columns;

                        if (remaining_columns > 0) {
                            footer_wrapper = "<div id=\"html_field_placeholder\" data-field-size=\"" + remaining_columns + "\" class=\"col-md-" + remaining_columns + "\"/>\n" + footer_wrapper;
					    }

					    self.$target.replaceWith(header_wrapper + result.html_string.replace("hff ","hff col-md-" + field_size + " ") + footer_wrapper);


					}
                });

                $('#htmlBinaryModal').modal('hide');

		    }

        });

    },
});

// ------------------------ INPUT GROUP CONFIG ----------------------
options.registry.html_form_builder_field_input_group = options.Class.extend({
    onBuilt: function() {
        var self = this;

    	this.template = 'html_form_builder_snippets.input_group_config';
    	self.$modal = $( qweb.render(this.template, {}) );

        //Remove previous instance first
        $('#htmlInputGroupModal').remove();

    	$('body').append(self.$modal);
    	var datatype_dict = ['one2many'];
    	var sub_fields = [];
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

		session.rpc('/form/field/config/general', {'data_types':datatype_dict, 'form_model':form_model, 'form_id': form_id}).then(function(result) {
		    self.$modal.find("#field_config_id").html(result.field_options_html);
        });

        $('#htmlInputGroupModal').modal('show');

        //Onchange the ORM field
        self.$modal.find('#field_config_id').change(function() {

		    session.rpc('/form/field/config/inputgroup', {'field_id': self.$modal.find('#field_config_id').val() }).then(function(result) {
		        self.$modal.find("#sub_fields_div").html(result.field_options_html);
            });

        });

        $('body').on('click', '#save_input_group_field', function() {
            var field_id = self.$modal.find('#field_config_id').val();
            if (field_id != "") {

                self.$modal.find("input[type='checkbox'][name='input_group_fields']:checked").each(function( index ) {
                    sub_fields.push( $( this ).val() );
                });

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': field_id, 'html_type': self.$target.attr('data-form-type'), 'sub_fields': sub_fields}).then(function(result) {
			        self.$target.replaceWith(result.html_string);
                });

                $('#htmlInputGroupModal').modal('hide');

		    }

        });

    },
});

options.registry.html_form_builder_field = options.Class.extend({
    onBuilt: function() {
        var self = this;
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')
        var form_model = this.$target.parents().closest(".html_form").attr('data-form-model')


	    session.rpc('/form/fieldtype', {'field_type': self.$target.attr('data-form-type') }).then(function(result) {
		var field_type = result.field_type;


        rpc.query({
                model: 'ir.model.fields',
                method: 'name_search',
                args: ['', [["model_id.model", "=", form_model],["ttype", "=", field_type],["name", "!=", "display_name"] ] ],
                context: weContext.get()
            }).then(function(field_ids){

	        wUtils.prompt({
			    id: "editor_new_field",
			    window_title: "New HTML Field",
			    select: "Select ORM Field",
			    init: function (field) {

                    var $group = this.$dialog.find("div.form-group");
                    $group.removeClass("mb0");

                    var $add = $(
                    '<div class="form-group">'+
                        '<label class="col-sm-3 control-label">Format Validation</label>'+
                        '<div class="col-sm-9">'+
                        '  <select name="formatValidation" class="form-control" required="required"> '+
                        '    <option value="">None</option>'+
                        '    <option value="email">Email</option>'+
                        '    <option value="lettersonly">Letters Only</option>'+
                        '  </select>'+
                        '</div>'+
                    '</div>'+
                    '<div class="form-group">'+
                        '<label class="col-sm-3 control-label">Character Limit</label>'+
                        '<div class="col-sm-9">'+
                        '  <input type="number" name="characterLimit" class="form-control" value="100"/>'+
                        '</div>'+
                    '</div>'+
                    '<div class="checkbox mb0">'+
                        '<label><input type="checkbox" name="form_required_checkbox">Required</label>'+
                    '</div>'
                    );
                    $group.after($add);

			        return field_ids;
			    },
			}).then(function (val, field_id, $dialog) {
                var format_validation = $dialog.find('select[name="formatValidation"]').val();
                var character_limit = $dialog.find('input[name="characterLimit"]').val();
                var field_required = $dialog.find('input[name="form_required_checkbox"]').is(':checked');

                session.rpc('/form/field/add', {'form_id': form_id, 'field_id': val, 'html_type': self.$target.attr('data-form-type'), 'format_validation': format_validation, 'character_limit': character_limit, 'field_required': field_required }).then(function(result) {
				    self.$target.replaceWith(result.html_string);
             	});
			});

        });


        });


    },
});



options.registry.html_form_builder_captcha = options.Class.extend({
    onBuilt: function() {
        var self = this;
        var form_id = this.$target.parents().closest(".html_form").attr('data-form-id')

        rpc.query({
		    model: 'html.form.captcha',
		    method: 'name_search',
		    args: [],
		    context: weContext.get()
		}).then(function(captcha_ids){


	        wUtils.prompt({
			    id: "editor_new_captcha",
			    window_title: "New Captcha",
			    select: "Select Captcha Type",
			    init: function (field) {

                    var $group = this.$dialog.find("div.form-group");
                    $group.removeClass("mb0");

                    var $add = $(
                    '<div class="form-group">'+
                        '<label class="col-sm-3 control-label">Client Key</label>'+
                        '<div class="col-sm-9">'+
                        '  <input type="text" name="clientKey" class="form-control"/>'+
                        '</div>'+
                    '</div>'+
                    '<div class="form-group mb0">'+
                        '<label class="col-sm-3 control-label">Client Secret</label>'+
                        '<div class="col-sm-9">'+
                        '  <input type="text" name="clientSecret" class="form-control"/>'+
                        '</div>'+
                    '</div>');
                    $group.after($add);

			        return captcha_ids;
			    },
			}).then(function (val, captcha_ids, $dialog) {

                var client_key = $dialog.find('input[name="clientKey"]').val();
                var client_secret = $dialog.find('input[name="clientSecret"]').val();

			    session.rpc('/form/captcha/load', {'captcha_id': val, 'form_id': form_id, 'client_key': client_key, 'client_secret':client_secret}).then(function(result) {
					self.$target.attr('data-captcha-id', val );
					self.$target.attr('data-captcha-client-key', client_key );
				    self.$target.html(result.html_string);
             	});

			});

        });
    },
    cleanForSave: function () {

		var captcha_id = this.$target.attr('data-captcha-id');
		var captcha_client_key = this.$target.attr('data-captcha-client-key');

        var form_id = $(".html_form_captcha").parents().closest(".html_form").attr('data-form-id');

        //We can't use sync rpc, the page will refresh before it's got the data back, so just use the attribute data-captcha-client-key
        return_string = "";
        return_string += "<script src=\"https://www.google.com/recaptcha/api.js\" async=\"async\" defer=\"defer\"/>\n";
        return_string += "<div class=\"g-recaptcha\" data-sitekey=\"" + captcha_client_key + "\"></div>";
        $(".html_form_captcha").html(return_string);

    },
});


});