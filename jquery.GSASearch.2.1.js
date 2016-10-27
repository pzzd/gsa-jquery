/*
* jQuery Google Search Appliance search plugin
* Version 1.0 (2/21/2010)
* @requires jQuery v1.3.2 or later
*
* Example at: http://webresourcesdev.uchicago.edu/GSA/widgets.html
*
* Usage:
* Here's a simple example:

		$("#mySearchResultsDiv").GSASearch({
           q: "pickle",
           num: 10
        });

* And here's another example that specifies a subdomain, allows multiple instances,
* and uses data added to the results DOM element:

var SEARCH1 = jQuery.noConflict(true);
SEARCH1(document).ready(function() {

	SEARCH1("#SEARCH1 .GSAForm").submit(function (){
		linkDiv = SEARCH1("#SEARCH1 .GSALink");
		pagerDiv = SEARCH1("#SEARCH1 div.GSAPager")
		resultsDiv = SEARCH1("#SEARCH1 div.GSAResults");
		thisQ = SEARCH1("#SEARCH1 input[name=GSAq]");
		perPageCount = 4;
		searchForm = this;

		linkDiv.empty();
		pagerDiv.empty();

		resultsDiv.GSASearch({
           q: thisQ.val(),
           num: perPageCount,
           sitesearch: "provost.uchicago.edu"
        });

        linkDiv.html('<a href="'+resultsDiv.data("searchSiteURL")+'" target="_blank">More results at search.uchicago.edu</a>');

		return false;
    });
});

* Parameters:
* 	q: the search term; if it's a query string parameter, use UrlHelper.queryStringParameter on it.
* 	start: the number of the results you want to start at; default is the first result
* 	num: the number of results to return
* 	sitesearch: the specific subdomain you want to search; default is www.uchicago.edu
* 	protocol: you can set it to your site's protocol with location.protocol, default is location.protocol
*	client: the GSA client, default is "default_frontend",
*	includeKeymatches: whether or not to include keymatches in the results, default is false
*
* Data:
* Some data is appended to the element that contains the results. See Usage for
* an example of getting the link to search.uchicag.edu
* 	searchSiteURL: URL to search.uchicago.edu that will yield the same results as plugin
* 	startNumber: number of the first item of the current page of search results
* 	totalCount: estimated total number of results from the search for all pages
*
* Please note that the total count from the GSA is only as estimate. See 
* https://developers.google.com/search-appliance/documentation/46/xml_reference#appendix_num_results.
* Depending on it to be accurate (e.g., for a pager's "last" button or even skipping 
* pages in a pager) could make it appear that there are no results coming from the GSA.
* 
* In the case of a pageer, you should use a "next" button only.
*
* Bind to the 'GSASearchComplete' event:
* The plugin triggers the GSASearchComplete custom event. You should bind this event
* to the results element when you want something to happen after the search results are
* loaded (e.g. using data related to number of results). Here's an example with
* a pager plugin that requires start number and total count.

	SEARCH1("#SEARCH1 div.GSAResults").bind("GSASearchComplete", function(){
		pagerDiv = SEARCH1("#SEARCH1 div.GSAPager");
		perPageCount = 4;
		resultsDiv = SEARCH1(this);

		pagerDiv.empty();
		thisPageNumber = Math.floor((parseInt(resultsDiv.data("startNumber"))+parseInt(perPageCount))/parseInt(perPageCount));
		thisPageCount = Math.ceil(parseInt(resultsDiv.data("totalCount"))/perPageCount);

		pagerDiv.pager({ pagenumber: thisPageNumber, pagecount: thisPageCount, buttonClickCallback: SEARCH1PagerClick });
	});

*
* CSS:
* You can use the default css files or copy and modify them.
* 	webresrouces/GSA/GSAPager.css
* 	webresources/GSA/GSAResults.css
*/

"use strict";

(function($) {

	$.fn.GSASearch = function(options){
		var defaults = {
			q: "",
			start: "",
			num: "10",
			sitesearch: "",
			site: "default_collection",
			waitGifPath: "webresources.uchicago.edu/js/jquery.GSASearch.wait.gif",
			protocol: location.protocol,
			client: "default_frontend",
			includeKeymatches: false
		};
		var options = $.extend(defaults, options);

		var resultsContainer = $(this);
		resultsContainer.data("searchSiteURL", options.protocol+'//search.uchicago.edu');
		resultsContainer.data("startNumber", "1");
		resultsContainer.data("totalCount", "10");


	 	return this.each(function() {
			resultsContainer.empty();
			resultsContainer.html('<img src="'+options.protocol+'//'+options.waitGifPath+'" class="GSAwait" />');

			// strip out HTML tags
			options.q = options.q.replace(/(<([^>]+)>)/ig,"");
			options.start = options.start.toString().replace(/(<([^>]+)>)/ig,"");
			options.num = options.num.toString().replace(/(<([^>]+)>)/ig,"");
			options.sitesearch = options.sitesearch.replace(/(<([^>]+)>)/ig,"");
			options.site = options.site.replace(/(<([^>]+)>)/ig,"");
			options.client = options.client.replace(/(<([^>]+)>)/ig,"");

			search(options.q, options.start, options.num, options.sitesearch, options.site, options.client);
	 	});

		function search(q, start, num, sitesearch, site, client) {
			var searchParams = '&q=' + UrlHelper.encode(q) + '&start='+ encodeURIComponent(start) + '&sitesearch=' 
			searchParams += encodeURIComponent(sitesearch) + '&site=' + encodeURIComponent(site) + '&client='+encodeURIComponent(client);
			// add filter=0: Eliminates the "omitted results" or "similar results" filter, and allows all results to show.
			searchParams += '&filter=0';

			var jsonParams = 'proxystylesheet=jsonp_frontend'+searchParams+ '&num='+ encodeURIComponent(num);
			var searchSiteURL = options.protocol+'//search.uchicago.edu/search?proxystylesheet=default_frontend'+searchParams;
			var proxyUrl = options.protocol+'//webresources.uchicago.edu/php/proxy/gsaproxy.php?encodedParams='+Base64.encode(jsonParams)+'&callback=?';
		    resultsContainer.data("searchSiteURL", searchSiteURL);

		    var fetchSuccess = 0;
		    var jqxhr = $.getJSON(proxyUrl, function(data) {
		    	showResults(data);
		    	fetchSuccess = 1;
		    });

		    if (jqxhr != undefined){
		    	jqxhr.error(function() { showError(); });
		    } else {
		    	setTimeout(function(){
		    		if (!fetchSuccess){
		    			showError();
		    		}
		    	},7000);
		    }
		}

		function showError(){
			var message = 'There is a problem fetching search results. Please refresh the page or contact <a href="mailto:weberror@uchicago.edu">weberror@uchicago.edu</a>.';
			resultsContainer.html(message);
	    	resultsContainer.data("totalCount", 0);
	    	resultsContainer.trigger('GSASearchComplete');
		}

		function showResults(data){
			var startNumber, totalCount = 0;

			var el, newEl;
			el = $('<div></div>');
			newEl = $('<h1></h1>');
			newEl.text('Search for '+data.GSP.Q);
			el.append(newEl);

			if (data.GSP.RES == undefined){
				newEl = $('<p>No pages were found.</p>');
				el.append(newEl);

			} else {
				newEl = $('<p class="gsasearch-result-count"></p>');
				newEl.text('Results '+data.GSP.RES.SN+' - '+data.GSP.RES.EN+' of about '+data.GSP.RES.M);
				el.append(newEl);

				if (data.GSP.GM != undefined && options.includeKeymatches == true){
					// if it's a single keymatch, put it in an array
					if (data.GSP.GM.length == undefined){
						var keyMatches = new Array(data.GSP.GM);
					} else {
						var keyMatches = data.GSP.GM;
					}
					for (i = 0; i < keyMatches.length; i++){
						newEl = $('<div class="gsasearch-gsp-gm"><div class="gsasearch-gsp-gm-gd"><a></a></div><div class="gsasearch-gsp-gm-gl"></div></div>');
						newEl.find('.gsasearch-gsp-gm-gd a').attr('href',keyMatches[i].GL);
						newEl.find('.gsasearch-gsp-gm-gd a').text(keyMatches[i].GD);
						newEl.find('.gsasearch-gsp-gm-gl').text(keyMatches[i].GL);
						el.append(newEl);
					}
				}

				var thisResultCount = data.GSP.RES.EN-data.GSP.RES.SN+1;
				el.append('<ul class="gsasearch-gsp-res"></ul>');


				if (thisResultCount == 1){
					var results = new Array(data.GSP.RES.R);
				} else {
					var results = data.GSP.RES.R;
				}

				for(var i=0; i<results.length; i++) {
					var result = results[i];
					if ( result['S'] == null ) { //avoid the output of 'null' when the snippet is empty
						result['S'] = '';
					}
					newEl = $('<li><a></a><br /><br /><em></em></li>');
					newEl.find('a').attr('href',result['U']);
					newEl.find('a').html(result['T']); // html tags are included with results from GSA
					newEl.find('em').text(result['U']);
					newEl.find('br:first').after(result['S']); // html tags are included with results from GSA
					el.find('.gsasearch-gsp-res').append(newEl);
				}

				var perPageCount = options.num;
				startNumber = data.GSP.RES.SN;
				// M is not reliable for the last page
				totalCount = (thisResultCount < perPageCount) ? data.GSP.RES.EN : data.GSP.RES.M;
			}

			resultsContainer.empty().append(el.contents());

			resultsContainer.data("startNumber", startNumber);
	    	resultsContainer.data("totalCount", totalCount);
	    	resultsContainer.trigger('GSASearchComplete');
		}


};
})(jQuery);

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

var Base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

}

/**
*
*  UrlHelper Functions to help use URL components
*
**/

var UrlHelper = {

	encode : function (input) {
		var output = encodeURIComponent(input);
		output = output.replace(/'/g,'%27');
		return output;
	},

	decode : function (input) {
		var output = decodeURIComponent(input);
		output = output.replace(/\+/g,' ');
		return output;
	},

	queryStringParameter: function (paramName) {
	    var queryString = window.location.search.substring(1);
	    var nameValPairs = queryString.split("&");
	    for (var i=0;i<nameValPairs.length;i++) {
	      var nameVal = nameValPairs[i].split("=");
	      if (nameVal[0] == paramName)
	        var output = nameVal[1];
	    }
		output = UrlHelper.decode(output);
		return output;
	}
}

