/*
 * 
    * jQuery MultiComplete
    * =====================
    * Written by Tom Hallam
    * http://tomhallam.github.com/jQuery-Multicomplete/
    * Licenced with the Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0) licence
    * See: http://creativecommons.org/licenses/by-sa/3.0/
 * 
 */

(function ($) {

    $.fn.multicomplete = function (options) {

        // Set up the default options
        var defaults = {

            // Debug mode provides verbose error messages
            debug: true,

            // Source
            source: [],
            
            // AJAX Method (if source is a URL)
            method: 'POST',

            // Minimum length before a search can be triggered
            minimum_length: 3,
            
            // Delay before performing a search, ignored if source is local
            search_delay: 500,
            
            // Case sensitive search?
            case_sensitive: false,
            
            // Highlight found words?
            highlight_results: true,
            
            // Left offset for results panel
            offset_left: 0,
            
            // Top offset for results panel
            offset_top: 5,
            
            // Result template
            result_template: function(row) {
                // -- Please fill this in!
            },
            
            // Events -------
            // On result click
            result_click: null,
            
            // On form submit
            form_submit: null
            
        }, 
        
        // Extend the base object
        settings = $.extend(defaults, options);
        
        // Object to keep track of our timers
        var timers = [],
        // And our result groups
            groups = {}, 
        // The results themselves
            results = [],
        // And the query
            query = '';

        // Iterate over the selected elements and apply the behavior.
        return this.each(function () {
            multicomplete_init($(this));
        });
        
        // Bootstrapper function to attach events to the elements selected
        function multicomplete_init(el) {
            
            // Create a unique ID for this element       
            id = 'multicomplete-' + Math.floor(Math.random() * 1000);
            $(el).data('multicomplete-id', id);
            
            // Make a new key in our timer object
            timers[id] = {};
            
            // We need to set a timer for input to trigger based on a delay
            $(el).on('keyup', function() {
                
                // Keep a local copy of the value
                query = $(this).val();
                
                // Clear any old timers
                window.clearTimeout(timers[id]);
                
                // If there's nothing left in the input box, do nothing and hide my result panel
                if(query.length == 0) {
                    $('.panel-multicomplete-results.' + id).hide();
                    return;
                }
                                
                // Reset the results array
                results = [];
                
                // Make sure the query is hitting the minimum length constraint
                if(query.length > settings.minimum_length) {
                
                    // Where are we sending this search?
                    switch(typeof(settings.source)) {
                        case 'string':
                            timers[id] = window.setTimeout(function(){ 
                                multicomplete_searchajax(function() {
                                    multicomplete_render(el);
                                }); 
                            }, settings.search_delay);
                            break;
                        case 'object':
                            multicomplete_searchobject();
                            multicomplete_render(el);
                            break;
                    }

                
                }
                
            }).attr('autocomplete', 'off');
            
            // Hide the DIV when someone clicks outside of the result pane.
            $(document).on('mouseup', function(e) {
                if($('.panel-multicomplete-results.' + id).has(e.target).length === 0) {
                    $('.panel-multicomplete-results.' + id).hide();
                }
            });
            
        }
                
        // Parse a result group 
        function multicomplete_parsegroup(group_results, group_name) {
                        
            // Loop through the group
            $(group_results).each(function(index, row) {
                
                for(var field in row) {
                    
                    // No numbers (for now)
                    if(typeof row[field] == 'number') {
                        return true;
                    }
                    
                    if(typeof row[field] == 'object') {
                        multicomplete_parsegroup(row);
                    }
                    else {
                        // If we find a result then push into our results array.
                        if(multicomplete_match(row[field])) {
                            results.push({
                                'field': field,
                                'row': row,
                                'group': group_name
                            });
                            return true;
                        }
                    }
                }
                               
            });
            
        }
        
        // Does this string match the query
        function multicomplete_match(field) {
            if(settings.case_sensitive == true) {
                return field.indexOf(query) > -1;
            }
            else {
                return field.toLowerCase().indexOf(query.toLowerCase()) > -1;
            }
        }
        
        // Search an object
        function multicomplete_searchobject() {
            
            if(settings.source.length == 0) {
                if(settings.debug == true) {
                    alert('Source was set to an array, but the array was empty.');
                }
            }
            
            // Loop through the source
            for(var group_name in settings.source) {
                if(settings.source[group_name].length)
                    groups[group_name] = multicomplete_parsegroup(settings.source[group_name], group_name);
            }
            
        }

        // Search an AJAX endpoint
        function multicomplete_searchajax(callback) {
            
            // Perform the remote call.
            ajax = $.ajax({
                'type': settings.method,
                'url': settings.source,
                'dataType': 'json',
                'data': {
                    'query': query
                },
                'success': function(data) {
                    
                    // Loop through the source
                    for(var group_name in data) {
                        if(data[group_name].length)
                            groups[group_name] = multicomplete_parsegroup(data[group_name], group_name);
                    }
                    
                    // Call the callback
                    callback.call(this, data);
                    
                },
                'error': function(error) {
                    if(settings.debug == true) {
                            if(error.status == 412) {
                                alert('Your remote data source is not valid JSON! Remember to use double quotes instead of single.');
                            }
                            if(error.status == 404) {
                                alert('Your remote data source does not exist on this server.');
                            }
                            if(error.status == 500) {
                                alert('The remote server encountered an error whilst processing your source.');
                            }
                    }
                }
            });
            
        }
        
        // Render a search result
        function multicomplete_render(el) {
            
            // Where is the element
            l = el.offset().left,
            t = el.offset().top,
            mc_html_class = 'panel-multicomplete-results ' + el.data('multicomplete-id'),
            mc_class = '.panel-multicomplete-results.' + el.data('multicomplete-id');
            
            // Is there already a results div for this element?
            if($(mc_class).length == 0) {
                
                // Build the div
                $('<div class="' + mc_html_class + '"></div>').css({
                    'position': 'absolute',
                    'left': (l + settings.offset_left),
                    'top': (t + $(el).height() + settings.offset_top)
                }).appendTo('body');
                
            }
            else {
                $(mc_class).empty().show();
            }
            
            // Were there any results?
            if(results.length == 0 && !$(mc_class + ' .panel-no-results').length) {
                $('<div class="panel-no-results">No results found</div>').appendTo(mc_class);
            }
            else {
                
                // Create a results div
                $('<div class="results"></div>').appendTo(mc_class);
                
                // Loop through the results and group them again
                $(results).each(function(index, result) {
                   if($(mc_class + ' .results .' + result.group).length == 0) {
                       $('<div class="group ' + result.group + '"><div class="group-title">' + result.group + '</div><div class="group-items"></div></div>').appendTo(mc_class + ' .results');
                   } 
                   
                   // Cache the result row
                   r = $('<div class="result"></div>').appendTo(mc_class + ' .results .' + result.group + ' .group-items');
                   
                   // Get the HTML for the result template
                   result_tmpl = settings.result_template.call(this, result.row, result.group, result.field);
                   
                   // Apply the click action
                   $(result_tmpl).on('click', function() {
                       
                       if(typeof settings.result_click == 'function') {
                           settings.result_click.call(this, result.row, result.group); 
                       }
                       else {
                           multicomplete_defaultclick(result.row, result.group, el);
                       }
                       
                   }).appendTo(r);
                   
                });
                
                // Apply a clearfix to the groups
                $('<div class="clearfix"></div>').appendTo(mc_class + ' .results .group');
                
                // If we have the highlight option turned on then do that
                if(settings.highlight_results == true) {
                    multicomplete_highlight($(mc_class + ' .results').get(0), query.toUpperCase());
                }
                                
            }
            
        }
        
        // Default click action for a result
        function multicomplete_defaultclick(result, group, el) {
            
            // Is there even a form?
            if($(el).closest('form').length == 0) {
            
            }
            
            else {
            
                // Override the form submit to do some funky tings
                $(el).closest('form').on('submit', function(e) {

                // Check if we've already modified the form
                if($(this).data('multicomplete-modified') == true) {
                    $(this).submit();
                }
                else {

                    // Stop the form from submitting
                    e.preventDefault();

                    // Modify the element
                    if(!!el.attr('name')) {
                        old_name = el.attr('name');
                        el.attr('name', el.attr('name' + '-mc-dummy'));
                    }

                    // Create a new hidden element with the ID
                    $('<input type="hidden" name="' + old_name + '" value="' + (!!result.id ? result.id : JSON.stringify(result)) + '" />').insertAfter(el);

                    // Add the checkpoint on to the form
                    $(this).data('multicomplete-modified', true);

                    // Submit the form
                    $(this).submit();

                }

                });
            
            }
            
        }
               
        /*
        
        highlight v3
        Highlights arbitrary terms.
        <http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html>
        MIT license.

        Johann Burkard
        <http://johannburkard.de>
        <mailto:jb@eaio.com>

        */
        function multicomplete_highlight(node, pat) {
            var skip = 0;
            if (node.nodeType == 3) {
                var pos = node.data.toUpperCase().indexOf(pat);
                if (pos >= 0) {
                    var spannode = document.createElement('span');
                    spannode.className = 'highlight';
                    var middlebit = node.splitText(pos);
                    var endbit = middlebit.splitText(pat.length);
                    var middleclone = middlebit.cloneNode(true);
                    spannode.appendChild(middleclone);
                    middlebit.parentNode.replaceChild(spannode, middlebit);
                    skip = 1;
                }
            } else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                for (var i = 0; i < node.childNodes.length; ++i) {
                    i += multicomplete_highlight(node.childNodes[i], pat);
                }
            }
            return skip;
        }
                
    }
})(jQuery);  