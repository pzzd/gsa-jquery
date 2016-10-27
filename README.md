# Google Search Appliance jQuery plugin

## Current Version 

The current version as of January 2015 is 2.1.

The previous version uses the deprecated javascript functions escape() and unescape() and should no longer be used. It's not clear when browsers will no longer support those functions.

## Adding Google Search Appliance (GSA) jquery plugin to a static site 
The GSA jquery plugin allows you to load search results in a site template.  No need to redirect off the site to the University branded search results.

### Instructions
#### Set up search form 
1. Set up a search form to your site with the usual redirect to the university search page. We’ll replace the current form with the jquery form using javascript to target browsers that have javascript enabled. 
2. Wrap the form in a div with a unique id for our javascript code to target.  I used id=”search_box.”
3. Add a script that replaces the current form.
4. Replace the form nested in the div tag with the new form that redirects to a page with the jquery form.  I used the replace function from the prototype library to do this.
5. The new form action should be the page with the new jquery form, and the text must have a value of GSAq.
6. Heres the string I used for the OI search form.  Remember to add a back slash before all quotes.
```
<form method="get" id="search" action="/search.html"> 
<input type="text" size="15" id="searchterm" name="GSAq" value="Search&#8230;" onFocus="if(this.value==\'Search&#8230;\')value=\'\'" onBlur="if(this.value==\'\')value=\'Search&#8230;\';" /> 
<input type="image" id="submit" name="btnG" value="Search" src="/i/global/search.jpg" alt="Go" onMouseOver="this.src=\'/i/global/search.jpg\'" onMouseOut="this.src=\'/i/global/search.jpg\'" />
</form>
```

#### Set up search results page
1. Build a page that will show search results.
2. Link to the following files on the new page.
default style sheet
```
<link href="//webresourcesdev.uchicago.edu/js/jquery.numberpager.css" rel="stylesheet" type="text/css" />
```
jquery
```
<script src="//webresources.uchicago.edu/js/jquery-1.3.2.min.js"></script>
```
GSA Plugin
```
<script src="//webresourcesdev.uchicago.edu/js/jquery.GSASearch.2.1.js"></script>
```
pagination
```
<script src="//webresourcesdev.uchicago.edu/js/jquery.numberpager.js" type="text/javascript"></script>
```
3. Add the following html for search results to load into.
```
<div class="GSAResults"></div><div class="GSAPager numberpager"></div><div class="GSALink"></div>
```
4. Add this script.  Update page count and site search variables. 
```
<script>
var SEARCH1 = jQuery.noConflict(true);  

SEARCH1(document).ready(function() {
	function submitSearch(searchTerm){ 
		linkDiv = SEARCH1(".search1 .GSALink");  
		pagerDiv = SEARCH1(".search1 div.GSAPager") 
		resultsDiv = SEARCH1(".search1 div.GSAResults"); 
		thisQ = searchTerm;
		perPageCount = 15; 
		linkDiv.empty();
		pagerDiv.empty(); 
 
		resultsDiv.GSASearch({
			q: thisQ,
			num: perPageCount,
			sitesearch: "oi.uchicago.edu"
		});

		linkDiv.html('<a href="'+resultsDiv.data("searchSiteURL")+'" target="_blank">More results at search.uchicago.edu</a>');
		return true;
	}

	var searchTerm = UrlHelper.queryStringParameter('GSAq');

	if (searchTerm != undefined){
		submitSearch(searchTerm);
	}

	SEARCH1(".search1 div.GSAResults").bind("GSASearchComplete", function(){
		resultsDiv.find("a").attr("target","_blank");
		pagerDiv = SEARCH1(".search1 div.GSAPager");
  		perPageCount = 15;
  		resultsDiv = SEARCH1(this);
    		pagerDiv.empty();
  		thisPageNumber = Math.floor((parseInt(resultsDiv.data("startNumber"))+parseInt(perPageCount))/parseInt(perPageCount));
  		thisPageCount = Math.ceil(parseInt(resultsDiv.data("totalCount"))/perPageCount);
    		pagerDiv.pager({ pagenumber: thisPageNumber, pagecount: thisPageCount, buttonClickCallback: SEARCH1PagerClick });
  	});
    	
	SEARCH1PagerClick = function(pageclickednumber) {
		resultsDiv = SEARCH1(".search1 div.GSAResults");
		perPageCount = 15;
		startNumber = (pageclickednumber*perPageCount)-perPageCount;
		resultsDiv.GSASearch({
			q: searchTerm,
			start: startNumber,
			num: perPageCount,
			sitesearch: "oi.uchicago.edu"
		}); 
	}
});
</script>
```

#### Finishing touches
1. There are default styles for the search results.  You’ll probably want to add a sitespecific style sheet. 
2. You can also add a search form on the results page.  The text input needs a name of “GSAq”.
