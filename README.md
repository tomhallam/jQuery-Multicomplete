jQuery Multicomplete
====================

A quick and intuitive way to show the most relevant results to your users.

How to use it
-------------

Installation couldn't be simpler! Simply include jQuery, the Multicomplete plugin (including it's CSS if you want it to look pretty!) and add this to your initialisation code for the page:

```
$(document).ready(function() {
    $('#my-input').multicomplete({
        'source': 'search.php'
    });
});
```

This will create an instance of Multicomplete which will query search.php to get its results by sending what was written in the input as a query header. If the plugin was set to use the GET method then the request would be search.php?query=what+i+asked+for. The next step is to get search.php to return what we need for the plugin to work!